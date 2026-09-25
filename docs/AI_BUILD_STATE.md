# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The SQLite network-first public-content cache is accepted by moving on. The target has been clarified further: the installed app must contain the published Scripture/prayer library itself so first-launch Browse and Prayer Detail can work without internet or sign-in.

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Bundled offline-content export pipeline

- Added `api/scripts/export-offline-content.cjs` and `npm run offline:export`.
- The exporter connects through the existing Prisma `DATABASE_URL` and reads only `PUBLISHED` `CuratedPrayer` rows.
- Content is emitted as one minified JSON pack per Bible book under `mobile/assets/offline/`, avoiding one giant repository/build asset.
- Each pack contains only public verse/prayer fields needed by the mobile experience: curated prayer id, reference, theme, Scripture text, insight, prayer points, closing prayer, and update timestamp.
- The exporter writes `manifest.json` with schema version, counts, total bytes, per-book byte sizes, content versions, and SHA-256 hashes so real bundle size can be measured before release.
- The exporter also generates `mobile/src/generated/offline-packs.ts` with static imports for every pack, allowing Expo/Metro to include the generated book files in Android/iOS builds in the next reader cycle.
- Previous generated JSON files are removed before export so deleted/renamed books cannot leave stale assets behind.
- The export refuses to proceed without `DATABASE_URL` or when no published rows exist, preventing an accidental empty offline library from being treated as valid.
- No credentials or production database dumps are written; only already-public published prayer content is exported.
- The repository currently does not contain the production `CuratedPrayer` rows, so the actual generated packs cannot be produced from GitHub alone. The export must be run once in an environment with access to the intended production database, then the generated public packs/registry can be reviewed and committed.

### Offline public-content cache

- Added Expo SDK 57 `expo-sqlite` `~57.0.3`, the version recommended by the SDK 57 SQLite reference.
- Added a persistent SQLite database `prayinverses-offline.db` with WAL mode and a parameterized `public_cache` table.
- Public Scripture/prayer reads use a network-first strategy: successful API responses refresh SQLite; network/server failures fall back to the latest cached value.
- SQLite write/read failures are best-effort and never replace a successful online response or hide the original network error.
- Cached resources include books, chapters, verses, chapter prayer-point counts, Verse of the Day, previous search-query results, and individual Prayer Detail content.
- Prayer Detail cache values are sanitized before persistence: `isSaved`, saved prayer-point indexes, and saved counts are reset so public offline storage never carries account-specific saved state across sessions.
- HTTP 4xx responses do not silently fall back to cache; only network failures/non-API failures and 5xx server failures can use offline fallback.
- Remembered guests skip the `/auth/me` network check at launch, so offline startup is immediate. If a non-guest session cannot be verified because the network/server is unavailable, the app still opens in read-only public mode instead of forcing Login.
- Offline access currently applies to content that has been loaded at least once on the device. A first-install full offline library/download pack is intentionally a later slice because the repository does not yet contain a bundled public prayer database.

### Guest read-only Scripture mode

- The Login screen now offers `Continue without signing in`.
- Guest choice is persisted in `expo-secure-store`, so a guest can relaunch directly into the app instead of being forced back through authentication.
- A successful authenticated login clears guest mode.
- Guest bottom navigation is intentionally limited to Home, Browse, and Sign In; account-only Pray, Community, and Profile tabs are not exposed as usable guest destinations.
- Guest Home loads Verse of the Day without calling authenticated Prayer Wall preview APIs and routes protected shortcuts such as Notifications, Saved Prayers, Journal, and Prayer Wall to Sign In.
- Guest Home clearly explains that Scripture/guided prayers are available without an account while personal/community features require sign-in.
- Published `/browse` API reads are now public. Optional auth middleware attaches a fully validated active user when a valid session cookie is present, so signed-in readers still receive their saved-prayer state.
- Prayer Detail is readable by guests. Save Prayer, save prayer point, and Journal actions prompt for sign-in instead of issuing protected requests.
- No personal write endpoint was made public.
- This cycle is guest/read-only access only; true offline caching/database support is the next separate slice.

### Mobile donation return and bounded verification

- Mobile donation initialization now sends Paystack to the HTTPS callback `/donations/thank-you?source=mobile`.
- The public thank-you page recognizes mobile-origin donations and immediately redirects the browser into `pray-in-verses://support/donate`, preserving a validated Paystack reference when present.
- The mobile donation screen accepts that deep-linked reference and immediately checks server-side donation state.
- Automatic confirmation polling is bounded to 60 seconds at 5-second intervals.
- If payment is still not confirmed after that window, the screen moves to a non-blocking `Payment still processing` state instead of continuing to wait.
- The pending reference remains stored on-device so the user can leave, return later, and manually/automatically check again.
- Successful/failed gateway states still clear the pending reference; confirmation remains server/webhook-owned rather than trusting the browser redirect.

### Screen-aware status bar

- The root layout keeps `StatusBar` style `dark` as the default for light-background screens.
- Home explicitly mounts `<StatusBar style="light" animated />` because its top safe area/hero is dark navy.
- Loaded Prayer Detail explicitly mounts `<StatusBar style="light" animated />` because its top safe area/hero is dark navy.
- Prayer Detail loading/error states continue using the root dark status-bar fallback because those states use a light background.
- The status-bar choice follows the actual screen background rather than blindly following the device theme.

### iOS release identity

- `mobile/` is confirmed as the authoritative Expo/EAS project directory for mobile builds.
- `npx eas-cli@latest project:info` run from `mobile/` resolves to `@mykiel/pray-in-verses` with EAS project ID `283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`.
- `mobile/app.json` now defines `ios.bundleIdentifier` as `com.prayinverses.app`.
- The repository-root `app.json` and `eas.json` files introduced by an accidental root-level EAS initialization are removed so they cannot redirect future builds to a different Expo project.
- Android package identity in `mobile/app.json` remains `com.prayinverses.app`.


### Authenticated safe-area ownership

- The parent authenticated `(app)` layout now gives the routed Stack its own `SafeAreaProvider`.
- That provider is physically limited to the Stack area above the shared bottom navigation, so descendant screens calculate their bottom safe area relative to the usable screen area rather than the full device window.
- The shared `AppBottomNavigation` remains outside that nested provider and therefore continues to own the real device bottom inset / Android navigation-area clearance.
- This removes the architectural cause of duplicated bottom spacing instead of patching the same `insets.bottom` symptom screen by screen.
- Existing screen-level top safe-area handling remains intact.

### Areas covered by the audit

The audit checked signed-in screens that previously used `useSafeAreaInsets()`, bottom `SafeAreaView` edges, fixed action footers, or lower floating actions. The Stack-local safe-area boundary now applies consistently to these flows, including:

- Prayer Detail actions.
- Journal list floating add and empty-state footer.
- Journal Entry Save / Delete / Update actions.
- Prayer Reminders list and reminder editor.
- My Prayers list and prayer editor.
- Prayer Wall list/create/detail flows.
- Donation / Support form content.
- Other authenticated routes rendered inside the parent Stack.

Scrollable content padding that is intentionally used to keep content clear of a screen's own floating button is retained; the change targets duplicated device safe-area spacing, not normal visual breathing room.

### Shared signed-in app navigation

- Signed-in screens use one shared bottom navigation owned by the parent `(app)` layout.
- Destinations remain Home, Browse, Pray, Community, and Profile.
- Detail screens retain Stack/back behavior.
- The shared nav hides while the software keyboard is visible and restores when it closes.
- Auth/onboarding screens remain outside the signed-in navigation.

### Existing accepted polish

- Prayer Detail `Short Insight` is justified.
- Add to Journal is keyboard-aware.
- Prayer Wall uses a large Share CTA only when truly empty and a lower floating `+` when populated.
- Journal and Prayer Reminders use state-based add actions.
- `.tsx` remains the correct TypeScript + JSX extension; `mobile/tsconfig.json` explicitly enables `react-jsx`.

## Completed

- Onboarding artwork and transition polish accepted.
- Login social-login removal accepted.
- Verse of the Day direct-to-detail navigation accepted.
- Journal list and Journal Entry action layout accepted.
- Prayer Reminders action simplification accepted.
- Shared signed-in navigation and Short Insight justification accepted.
- Prayer Detail journal keyboard avoidance accepted.
- Prayer Wall creation-action simplification accepted.
- TSX/JSX compiler configuration accepted.
- Prayer Detail action-row spacing reduction accepted as the spacing reference.
- Authenticated Stack safe-area ownership audit/fix accepted through continued release work.
- iOS bundle identity, Apple signing credentials, push key, production build, and initial TestFlight upload completed.
- Screen-aware iOS/Android status-bar styling accepted.
- Mobile donation success return-to-app deep link and bounded verification accepted by continued work.
- Guest read-only Scripture mode accepted by continued work.
- SQLite network-first/public-content offline cache accepted by continued work.
- Production-to-mobile bundled offline-content export pipeline implemented; real pack generation is awaiting a database-connected run.

## Next Tasks

1. Pull this commit and run `npm run offline:export` from `api/` in an environment whose `DATABASE_URL` can read the production Pray in Verses database.
2. Review the generated `mobile/assets/offline/manifest.json` totals and real bundle size, then commit the generated public book packs and `mobile/src/generated/offline-packs.ts`.
3. Wire the mobile SQLite bootstrap to import the bundled packs on first launch and make local SQLite the primary Browse/Prayer source even before any network request.
4. Add content-version update/sync behavior so the API can refresh the bundled baseline after installation without removing first-launch offline capability.
5. Complete the remaining iOS functional pass and produce the next native release build.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation remains webhook/server-owned. The mobile UI now stops automatic waiting after 60 seconds and preserves the reference for later checks.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- The bundled-library exporter is implemented, but first-launch full offline reading is not complete until a real production export is generated/committed and the mobile bootstrap/import reader is wired.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status\n\nBundled offline-content exporter is pushed for a database-connected export run.\n\nRun from `api/` in an environment that already has the correct `DATABASE_URL`:\n\n`npm run offline:export`\n\nExpected checks:\n\n1. The command must refuse to run when `DATABASE_URL` is absent.\n2. It must refuse to generate an empty library when zero published `CuratedPrayer` rows are found.\n3. It should create `mobile/assets/offline/manifest.json` plus one JSON file per published Bible book.\n4. `manifest.json` should report realistic `totalBooks`, `totalPrayers`, `totalPrayerPoints`, and `totalBytes` values.\n5. Spot-check at least Genesis, Psalms, John, Romans, and Revelation for correct chapter/verse ordering and complete theme/Scripture/insight/prayer-points/closing fields.\n6. Re-run the export without database changes: individual book-pack hashes should remain stable because book pack payloads do not contain an export timestamp.\n7. Confirm `mobile/src/generated/offline-packs.ts` contains one static import/map entry per generated book.\n8. Do not commit or share the database URL, `.env`, credentials, or raw database dumps.\n\nValidation performed in this environment:\n\n- Re-inspected remote `main`, `mobile/AGENTS.md`, current build state, Prisma schema, API package tooling, curated-prayer service, seed data, Bible constants, and repository data files.\n- Confirmed the repository contains Bible structure/verse counts but not the real production published CuratedPrayer dataset; the seed contains only two samples.\n- The exporter uses existing Node/Prisma dependencies only; no package dependency or database schema/migration changes are required.\n- Output is split per book to reduce single-file size risk and make bundle-size/content review practical.\n- No production database connection is available through the GitHub connector, so actual pack generation cannot be truthfully validated here.\n\n## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation remains authoritative for mobile implementation.
- The shared bottom navigation owns the authenticated app's physical device bottom safe-area inset.
- Authenticated routed screens calculate safe areas relative to the Stack viewport above that navigation through a nested `SafeAreaProvider`.
- Screen-local visual spacing and content clearance may remain, but routed screens should not independently reserve the device bottom inset again.
- `.tsx` remains the standard extension for TypeScript files containing React JSX.
- Status-bar styling is screen-background-aware: dark top surfaces explicitly request light status-bar content, while the root dark-content default covers light screens.
- Paystack callbacks remain HTTPS as required by the gateway; mobile callbacks use the website only as a short bridge to the app's `pray-in-verses://` scheme.
- Donation success is trusted only after server/webhook status confirmation; client redirects never mark a donation paid.
- Published Scripture/prayer reading is public; personalized state is layered on through optional validated auth, while writes remain protected.
- Guest-mode persistence is local device state and does not create a server-side account.
- Public offline content is network-first with SQLite fallback; personal account state is deliberately excluded from the public cache.
- The release target is offline-first from installation: published CuratedPrayer content will be generated into per-book assets and statically bundled with the native app; network access becomes an update/sync layer rather than a prerequisite for reading.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: add a deterministic production CuratedPrayer → per-book mobile offline-pack exporter, manifest with size/hash metadata, and generated Metro registry pipeline. Actual content generation awaits a run against the production database. Status: AWAITING USER TEST.
