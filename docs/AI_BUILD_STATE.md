# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING ANDROID RELEASE-OPTIMIZATION BUILD TEST

## Last Accepted Task

The Android preview/offline-first build step is accepted by moving on with no problem reported. The bundled public library remains on `main`: 66 Bible books, 31,081 verse-level CuratedPrayer records, 217,363 prayer points, and 69,404,220 raw JSON bytes (~66.19 MiB).

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Android release optimization

- Added a local Expo config plugin at `mobile/plugins/with-android-release-optimization.js`.
- The plugin writes `android.enableMinifyInReleaseBuilds=true` so release builds run R8 minification/obfuscation.
- The plugin also writes `android.enableShrinkResourcesInReleaseBuilds=true` so unused Android resources are removed in release builds.
- The implementation uses Expo's supported Gradle-properties mod instead of editing generated `android/app/build.gradle` directly.
- The plugin is registered in `mobile/app.json` and therefore applies during EAS prebuild/CNG.
- No large-screen, orientation, resizability, or edge-to-edge behavior was changed in this cycle. Those Play recommendations are intentionally deferred to a later dedicated layout pass.
- Because R8 can expose native-library keep-rule issues even when compilation succeeds, the optimized release configuration must be smoke-tested before the Play production AAB is promoted.

### Cross-platform release versioning

- Production builds now use EAS remote developer-version management with `cli.appVersionSource: "remote"`.
- The production profile enables `autoIncrement: true`, so each Android production build receives a new `versionCode` and each iOS production build receives a new `buildNumber`.
- Local seed values are explicitly set to Android `versionCode: 1` and iOS `buildNumber: "1"`, matching the first release generation baseline. With remote auto-increment, the next production build is expected to advance beyond the existing iOS TestFlight build number 1 rather than collide with it.
- User-facing app version remains `1.0.0` for this release cycle.
- Android preview/internal builds remain APKs. Android production builds remain the default AAB format required for Google Play.
- iOS production builds remain IPA/App Store builds suitable for TestFlight/App Store Connect.

### Unified mobile error presentation

- Added `mobile/src/services/user-facing-error.ts` as the single translator from API/runtime failures to user-facing copy.
- HTTP status handling is centralized: authentication/permission/rate-limit/server failures receive stable friendly wording, while raw technical/server messages are hidden by default.
- Server validation copy is exposed only on explicitly allowed client-error statuses and only after filtering technical-looking messages.
- Added reusable `InlineErrorMessage` for form/action failures with consistent icon, border, spacing, color, and accessibility semantics.
- `AppStateView` now marks error states as accessibility alerts and is the standard presentation for content/load failures with retry actions.
- Authentication, Browse, Home, Community, My Prayers, Journal, Saved Prayers, Prayer Wall, Prayer Detail, Reminders, Notifications, Account, and Donation flows now use the shared error system.
- Screens that previously mixed load and action failures now keep them separate where needed, so a failed like/bookmark/delete/toggle no longer replaces an otherwise valid content screen with a misleading reload error.
- Failure popups were removed from Prayer Wall and Prayer Detail actions. Inline errors now stay in context. Native alerts remain only for confirmations, sign-in prompts, and successful journal-save feedback where they are intentional.
- Offline/public Scripture fallbacks still suppress network errors when bundled content can satisfy the read, so users do not see an error simply because they are offline.

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
- Guest/read-only access now works together with the committed bundled public library and SQLite response cache; personal writes still require authentication.

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
- Unified user-facing error translation and consistent load/form/action error presentation implemented across the primary mobile flows.

## Next Tasks

1. Pull `main` and run `npx expo install --fix` followed by `npx expo-doctor` from `mobile/` to clear the remaining SDK 57 patch-version drift before release.
2. Commit/push any dependency-alignment changes generated by Expo so GitHub `main` remains the source of truth.
3. Build a fresh Android preview APK with the new R8/resource-shrinking configuration and smoke-test launch, Browse/offline reading, auth, Prayer Detail, Journal, Prayer Wall, notifications/reminders, account, and donation entry.
4. If the optimized preview passes, create the Android production AAB and upload it to Google Play; then re-check Play Console's DEX optimization metrics for the new bundle.
5. Build a new iOS production artifact with a build number higher than the existing TestFlight build 1 and submit it to App Store Connect.
6. Defer large-screen/orientation/resizability work and the Android edge-to-edge recommendation to a later dedicated cycle.
7. After release acceptance, continue content-version sync, verified Android App Links, and remote push delivery.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation remains webhook/server-owned. The mobile UI now stops automatic waiting after 60 seconds and preserves the reference for later checks.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- The bundled public library is now committed and wired as a first-install fallback. Offline search may be heavier than online search because it can lazily scan multiple book packs when no network/cache result exists.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the optimized release build is treated as release-ready.
- Google Play reported low DEX optimization/obfuscation on the previous bundle. R8 minification and resource shrinking are now configured for future release builds; the next uploaded AAB must be checked to confirm Play recalculates improved metrics.
- Google Play's large-screen orientation/resizability recommendation is intentionally deferred to a later dedicated responsive-layout cycle.
- Google Play's edge-to-edge deprecated-API recommendation is also deferred to a later Android platform polish cycle; no platform behavior was changed for it in this release-optimization patch.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status

Android release optimization is pushed and awaiting a fresh optimized build/device smoke test.

Required validation before Play production promotion:

1. Run `npx expo install --fix` and `npx expo-doctor`; Expo SDK dependency compatibility should be clean.
2. Build the Android `preview` profile after pulling this commit. The preview build is a release-style APK, so the R8/resource-shrinking settings are exercised.
3. Install the optimized preview APK and confirm the app starts normally.
4. Test bundled/offline Browse and Prayer Detail because the application ships a large static content library.
5. Test authenticated API flows, saved prayers, Journal, Prayer Wall actions, notifications/reminders, Account, and donation initialization to catch any R8 reflection/keep-rule regressions.
6. Only after the optimized preview passes, build the Android `production` AAB.
7. Upload the AAB to Play Console and inspect the new artifact's DEX optimization/obfuscation/shrinking metrics.

Repository validation performed:

- Re-read the exact Expo SDK 57 BuildProperties documentation before this cycle.
- Expo SDK 57 documents `enableMinifyInReleaseBuilds` as enabling R8 and `enableShrinkResourcesInReleaseBuilds` as removing unused Android resources in conjunction with minification.
- Used an Expo config plugin/Gradle-properties mod so EAS prebuild applies the settings without committing generated native directories.
- No API, database, payment contract, iOS native setting, app orientation, or large-screen behavior was changed.
- GitHub has no configured commit-status checks; EAS build plus physical-device smoke testing remains the acceptance gate.

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
- User-visible errors follow one hierarchy: load failures use `AppStateView`, form/action failures use `InlineErrorMessage`, and native alerts are reserved for confirmations or intentional modal prompts rather than routine failures.
- Raw backend messages are not trusted for display by default; only explicitly allowed, filtered client-validation messages may reach the UI.
- Android release builds enable R8 minification and resource shrinking through Expo prebuild Gradle properties; generated Android native files remain uncommitted.
- Large-screen/orientation/resizability changes are intentionally separated from release optimization so they can be designed and tested as a dedicated responsive-layout task.

## Last Commit

Current cycle: enable R8 minification and Android resource shrinking for release builds while deferring large-screen/platform-layout work. Status: AWAITING ANDROID RELEASE-OPTIMIZATION BUILD TEST.
