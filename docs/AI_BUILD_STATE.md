# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The mobile donation return and bounded verification flow is accepted by moving on: Paystack mobile callbacks bridge back into Pray in Verses and automatic confirmation stops after 60 seconds rather than waiting indefinitely.

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

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
- Guest read-only Scripture mode implemented for device/API review.

## Next Tasks

1. Pull/deploy the guest-mode API/mobile changes and test guest Home → Browse → Prayer Detail without signing in.
2. Implement the offline cache layer with Expo SQLite: cache public books/chapters/verses/prayer detail and fall back to local data when the network is unavailable.
3. Add explicit offline-download controls/strategy after measuring content/database size.
4. Complete the remaining iOS functional pass and prepare the next iOS build containing accepted fixes.
5. Complete App Store metadata, privacy answers, screenshots, review credentials, and submission.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation remains webhook/server-owned. The mobile UI now stops automatic waiting after 60 seconds and preserves the reference for later checks.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Guest mode currently requires network access for Scripture content; offline SQLite caching is not implemented yet.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status

Guest read-only mode is pushed for API/mobile review.

Test after the API containing this commit is deployed:

1. From Login, tap `Continue without signing in`; confirm Home opens without an account.
2. Kill and reopen the app; confirm the remembered guest choice returns to the app instead of forcing Login.
3. As guest, open Browse → book → chapter → verse and confirm Scripture Prayer loads.
4. On Prayer Detail as guest, tap Save Prayer, a prayer-point bookmark, and Add to Journal; each must ask the user to sign in and must not write data.
5. On guest Home, Notifications, Prayer Wall, Saved Prayers, and Journal shortcuts must lead to Sign In; Support/Donation remains reachable.
6. Guest bottom navigation must show only Home, Browse, and Sign In.
7. Sign in with a real account; confirm the full five-item navigation returns and saved-prayer state still appears correctly on Prayer Detail.
8. Confirm all existing protected write APIs remain unauthorized without a valid session.

Validation performed in this environment:

- Re-read the exact Expo SDK 57 reference before modifying mobile code.
- Re-inspected current remote `main`, auth bootstrap/login, shared navigation, Home, Browse, Prayer Detail, curated-prayer API guard/service/module, and optional-auth middleware.
- Public API exposure is limited to published `/browse` GET content. Personal write controllers remain protected.
- Optional authentication validates JWT signature, active user status, and auth-version before attaching personalized saved-state context.
- No database schema, migration, dependency, payment-secret, or environment changes were introduced.
- Repository CI status checks are not configured for direct commits; API deployment plus Android/iPhone testing remains the acceptance gate.

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
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: add persistent guest read-only mode, public published Scripture/prayer reads with optional personalization, guest-safe Home/navigation, and sign-in gates for personal Prayer Detail actions. Status: AWAITING USER TEST.
