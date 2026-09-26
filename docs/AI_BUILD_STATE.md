# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The production offline-content export is accepted by moving on. GitHub now contains the complete generated public library: 66 Bible books, 31,081 verse-level CuratedPrayer records, 217,363 prayer points, and 69,404,220 raw JSON bytes (~66.19 MiB).

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### First-install bundled Scripture/prayer fallback

- Public Browse and Prayer Detail reads now have the committed bundled library as a final fallback after network/server failure and any existing SQLite cache miss.
- A fresh install can therefore browse books, chapters, verses, chapter prayer-point counts, Verse of the Day, Prayer Detail, and search without having previously opened that content online.
- Signed-in online Prayer Detail still uses the API first so account-specific saved-prayer state remains authoritative; bundled fallback deliberately reports unsaved public state when the network is unavailable.
- The generated registry now uses static lazy per-book `require(...)` loaders rather than importing all 66 JSON packs at module evaluation time, reducing startup parsing/memory pressure while still allowing Metro to bundle every pack.
- Offline search scans bundled books only when both the network and the existing query cache are unavailable; normal online search behavior is unchanged.
- The existing SQLite response cache remains useful for server-fresh content. This cycle does not yet replace the JSON bundle with a prebuilt SQLite asset or implement background content-version synchronization.

### Bundled offline-content export pipeline

- Added `api/scripts/export-offline-content.cjs` and `npm run offline:export`.
- The exporter explicitly loads `api/.env` through the direct `dotenv` dependency, while preserving an already-set process `DATABASE_URL`, so the user does not need to paste production credentials into a terminal command.
- The exporter connects through the existing Prisma `DATABASE_URL` and reads only `PUBLISHED` `CuratedPrayer` rows.
- Content is emitted as one minified JSON pack per Bible book under `mobile/assets/offline/`, avoiding one giant repository/build asset.
- Each pack contains only public verse/prayer fields needed by the mobile experience: curated prayer id, reference, theme, Scripture text, insight, prayer points, closing prayer, and update timestamp.
- The exporter writes `manifest.json` with schema version, counts, total bytes, per-book byte sizes, content versions, and SHA-256 hashes so real bundle size can be measured before release.
- The exporter generates `mobile/src/generated/offline-packs.ts` with static lazy `require(...)` loaders for every pack, allowing Expo/Metro to include every book while parsing a book only when that pack is needed.
- New output is built in a staging directory first. Existing generated packs are left untouched when database validation/query/export fails; stale JSON packs are replaced only after a complete staged export exists.
- Book names are validated for slug/filename collisions before any generated output is replaced, preventing inconsistent production names such as case variants from silently overwriting one another.
- The export refuses to proceed without `DATABASE_URL` or when no published rows exist, preventing an accidental empty offline library from being treated as valid.
- No credentials or production database dumps are written; only already-public published prayer content is exported.
- The production export has now been generated and committed: 66 books, 31,081 verse-level records, 217,363 prayer points, and 69,404,220 raw JSON bytes (~66.19 MiB).

### Offline public-content cache

- Added Expo SDK 57-compatible `expo-sqlite` `~57.0.3`.
- Added a persistent SQLite database `prayinverses-offline.db` with WAL mode and a parameterized `public_cache` table.
- Public Scripture/prayer reads use a network-first strategy: successful API responses refresh SQLite; network/server failures fall back to the latest cached value.
- SQLite write/read failures are best-effort and never replace a successful online response or hide the original network error.
- Cached resources include books, chapters, verses, chapter prayer-point counts, Verse of the Day, previous search-query results, and individual Prayer Detail content.
- Prayer Detail cache values are sanitized before persistence: `isSaved`, saved prayer-point indexes, and saved counts are reset so public offline storage never carries account-specific saved state across sessions.
- HTTP 4xx responses do not silently fall back to cache; only network failures/non-API failures and 5xx server failures can use offline fallback.
- Remembered guests skip the `/auth/me` network check at launch, so offline startup is immediate. If a non-guest session cannot be verified because the network/server is unavailable, the app still opens in read-only public mode instead of forcing Login.
- The SQLite cache still stores server-fresh responses, but first-install public reading no longer depends on that cache because the committed bundled library is now the final fallback.

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
- Production-to-mobile bundled offline-content export pipeline completed with the full public library committed.
- First-install bundled fallback wired for Browse, Verse of the Day, search, and Prayer Detail.

## Next Tasks

1. Pull and run the mobile app on a native build containing `expo-sqlite`, then test a true fresh-install/cleared-data airplane-mode flow.
2. Confirm all 66 books, representative chapters/verses, Prayer Detail, Verse of the Day, and an offline search query work without any prior network request.
3. Measure startup/memory/search performance on the Android acceptance device; if offline search is too heavy, move the shipped baseline to a prebuilt SQLite asset/index instead of scanning JSON packs.
4. Add content-version update/sync behavior so online devices can refresh the bundled baseline without waiting for a new app binary.
5. Complete the remaining iOS functional pass and produce the next native release build.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation remains webhook/server-owned. The mobile UI now stops automatic waiting after 60 seconds and preserves the reference for later checks.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- The bundled public library is now committed and wired as a first-install fallback. Offline search may be heavier than online search because it can lazily scan multiple book packs when no network/cache result exists.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status

First-install bundled public reading is pushed for physical-device review.

Before testing, pull `main` and run `npm ci` in `mobile/`. Because `expo-sqlite` is a native dependency, a custom Dev Client built before SQLite was added may need to be rebuilt; the existing TestFlight binary predates this dependency and cannot validate this cycle.

Required acceptance test:

1. Clear app data/uninstall the test build so there is no prior SQLite/public cache.
2. Disable Wi-Fi and mobile data before launching the freshly installed app.
3. Continue without signing in.
4. Open Browse and confirm both testaments populate from the bundled library.
5. Open representative books such as Genesis, Psalms, John, Romans, and Revelation; open chapters and multiple Prayer Detail screens.
6. Confirm Scripture text, theme, Short Insight, prayer points, and closing prayer render with no network.
7. Open Verse of the Day from Home and confirm it resolves offline.
8. Run at least one new search term that has never been cached; results should come from the bundled packs.
9. While still offline, Save/Journal actions must continue to require sign-in and must not create local fake account state.
10. Restore internet, sign in, and confirm Prayer Detail again reflects server-owned saved state.

Validation performed in this environment:

- Re-read the exact Expo SDK 57 SQLite documentation before this mobile cycle. Expo documents persisted databases, parameterized async APIs, transactions, and importing an existing bundled database with `SQLiteProvider assetSource`. citeturn318149view0turn534262view0
- Re-inspected remote `main`, `mobile/AGENTS.md`, the committed manifest/registry, public service layer, current SQLite cache, auth launch behavior, and exporter.
- Manifest currently reports 66 books, 31,081 verse-level records, 217,363 prayer points, and 69,404,220 raw JSON bytes (~66.19 MiB).
- Registry generation now emits lazy static pack loaders rather than eager top-level JSON imports.
- No API endpoint, Prisma schema, migration, auth write, payment flow, or environment variable was changed in this cycle.
- Repository CI status checks are not configured for these direct commits; native physical-device testing remains the acceptance gate.

## Architecture Decisions

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
- Public reads remain network-first for freshness and personalized server state, then use the existing SQLite response cache, then the committed bundled public library as the final offline fallback. Personal account state is never embedded in bundled content.
- The release target is offline-first from installation: the complete published CuratedPrayer baseline is generated into per-book assets and statically bundled with the native app; network access is an online freshness/personalization layer rather than a prerequisite for public reading.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: wire the committed 66-book public library into first-install offline fallbacks for Browse, Verse of the Day, search, and Prayer Detail, while switching the generated registry to lazy per-book loaders. Status: AWAITING USER TEST.
