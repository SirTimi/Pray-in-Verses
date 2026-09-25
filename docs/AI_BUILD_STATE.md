# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The iOS release identity and signing setup are accepted: the mobile project is linked to `@mykiel/pray-in-verses`, `com.prayinverses.app` is registered with Apple, distribution/provisioning/push credentials are ready, and the first production iOS build `1.0.0 (1)` was successfully uploaded to TestFlight.

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

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
- Screen-aware iOS/Android status-bar styling implemented for Home and Prayer Detail.

## Next Tasks

1. Pull the status-bar commit and validate Home and Prayer Detail on an iPhone/TestFlight build.
2. Complete the remaining TestFlight functional pass on iOS.
3. Prepare the next iOS build number before uploading a replacement build containing this polish.
4. Complete App Store metadata, privacy answers, screenshots, review credentials, and submission.
5. Submit the accepted iOS build for App Review.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status

Status-bar polish is pushed for iPhone review.

Validate these states on iOS:

1. Home: the time, signal/Wi-Fi, and battery indicators are white over the dark navy top area.
2. Prayer Detail after content loads: status-bar text/icons are white over the dark prayer banner.
3. Prayer Detail loading/error state: status-bar text/icons remain dark on the light state screen.
4. Browse, My Prayers, Prayer Wall, Profile, and other light-background screens retain dark status-bar text/icons.
5. Navigate repeatedly between Home/Prayer Detail and light screens and confirm the status-bar style switches back correctly.

Validation performed in this environment:

- Re-inspected current remote main, recent commits, `mobile/AGENTS.md`, root/app layouts, Home, Prayer Detail, and representative light-background screens.
- Reviewed Expo status-bar guidance: declarative `StatusBar` components can be mounted per screen, with `light` and `dark` controlling text/icon contrast.
- The exact SDK 57 status-bar URL was requested but the documentation host timed out in the browsing environment; the current Expo system-bar guidance and adjacent versioned StatusBar API confirm the same declarative behavior.
- No API, database, schema, migration, authentication, payment, dependency, or environment changes were introduced.
- Repository CI status checks are not configured for these direct commits; iPhone/TestFlight review remains the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation remains authoritative for mobile implementation.
- The shared bottom navigation owns the authenticated app's physical device bottom safe-area inset.
- Authenticated routed screens calculate safe areas relative to the Stack viewport above that navigation through a nested `SafeAreaProvider`.
- Screen-local visual spacing and content clearance may remain, but routed screens should not independently reserve the device bottom inset again.
- `.tsx` remains the standard extension for TypeScript files containing React JSX.
- Status-bar styling is screen-background-aware: dark top surfaces explicitly request light status-bar content, while the root dark-content default covers light screens.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: make status-bar contrast screen-aware by keeping the root dark-content default and overriding Home and loaded Prayer Detail to light/white status-bar content over their dark headers. Status: AWAITING USER TEST.
