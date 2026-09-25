# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Guest read-only Scripture mode is accepted by moving on: users can continue without signing in, public published Scripture/prayer reads are available without auth, and personal writes remain protected.

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

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
- SQLite network-first/public-content offline cache implemented for device review.

## Next Tasks

1. Pull/install dependencies and test the SQLite cache on Android/iOS: load content online, disable connectivity, then reopen the same Browse/Prayer paths.
2. Measure representative cache/library sizes and design explicit offline-download controls for books/testaments/full library.
3. Decide whether the release should include a small bundled starter database for useful first-launch offline access.
4. Complete the remaining iOS functional pass and prepare the next iOS build containing accepted fixes.
5. Complete App Store metadata, privacy answers, screenshots, review credentials, and submission.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation remains webhook/server-owned. The mobile UI now stops automatic waiting after 60 seconds and preserves the reference for later checks.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Offline SQLite fallback only covers public content previously loaded on that device; a fresh install with no cache still needs internet until starter/download packs are implemented.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status

SQLite public-content caching is pushed for physical-device review.

After pulling this commit, run `npm ci` in `mobile/` so `expo-sqlite` 57.0.3 is installed. Because SQLite is a native module, an existing custom development client built before this dependency was added may need a new native/dev build; Expo Go already includes Expo SQLite.

Test on Android/iOS:

1. With internet on, enter guest mode and open Browse, one book, one chapter, several verses, one Prayer Detail, Verse of the Day, and one search query.
2. Fully disable Wi-Fi/mobile data.
3. Reopen those same cached Browse/book/chapter/Prayer Detail paths; they should load from SQLite rather than showing the network error.
4. Re-run the same search query offline; its previously cached results should load.
5. Try a book/chapter/prayer that was never opened before; it should still show the normal unavailable/network error because it has not been cached yet.
6. Sign in online, open a prayer that is saved to the account, then go offline and reopen it; content should load, but cached public state must not claim the prayer or points are saved.
7. Restore internet and confirm fresh server content replaces/refreshes cached content.

Validation performed in this environment:

- Re-read the exact Expo SDK 57 SQLite reference before implementation.
- SDK 57 recommends `expo-sqlite` `~57.0.3`; the implementation uses `openDatabaseAsync`, WAL mode, `runAsync`, and `getFirstAsync` with bound parameters.
- `mobile/package.json` and `mobile/package-lock.json` are updated together, including `await-lock` required by Expo SQLite.
- Offline caching is isolated in the mobile service layer; no screen duplicates caching logic.
- No API, schema, migration, auth-write, payment, or environment changes were introduced in this cycle.
- Repository CI status checks are not configured for direct commits; dependency install plus physical-device offline testing remains the acceptance gate.

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
- Public offline content is network-first with SQLite fallback; personal account state is deliberately excluded from the public cache.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle follow-up: harden SQLite as a best-effort cache and allow remembered guests / temporarily offline sessions to enter read-only public mode without waiting on authentication. Status: AWAITING USER TEST.
