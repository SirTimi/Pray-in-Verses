# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then complete the iOS App Store release workflow.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The screen-aware status-bar polish is accepted by moving on: dark Home and loaded Prayer Detail use light/white status-bar content while light screens retain the root dark-content default.

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

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
- Mobile donation success return-to-app deep link and bounded verification implemented for device review.

## Next Tasks

1. Pull and test the mobile donation return flow on Android/iOS: successful Paystack checkout should return to the app and confirmation must stop auto-waiting after 60 seconds.
2. Design and implement guest/offline mode as a separate architecture slice: public Scripture/prayer reading without sign-in, local cached/bundled content, and auth-gated personal/community writes.
3. Complete the remaining iOS functional pass and prepare the next iOS build containing accepted fixes.
4. Complete App Store metadata, privacy answers, screenshots, review credentials, and submission.
5. Submit the accepted iOS build for App Review.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation remains webhook/server-owned. The mobile UI now stops automatic waiting after 60 seconds and preserves the reference for later checks.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS previously had conflicting root/mobile configuration. The authoritative mobile project has now been confirmed as `@mykiel/pray-in-verses` (`283c8c7d-7fed-4822-ae3e-07d50a2a6d9c`), and the accidental root Expo/EAS configs are removed in the current cycle.

## Testing Status

Donation return/polling polish is pushed for device review.

Test on Android and iOS:

1. Start a donation from the app and complete Paystack successfully.
2. Confirm Paystack's HTTPS callback automatically opens `pray-in-verses://support/donate` and returns the user to the app rather than leaving them on the website.
3. Confirm the app checks the server-side reference after return and shows Success when the webhook has landed.
4. For a deliberately delayed/pending payment, confirm automatic checking stops after 60 seconds and changes to `Payment still processing`.
5. Confirm `Done for now` leaves the donation screen without losing the saved reference.
6. Reopen Support > Donate later and confirm the saved reference is checked again.
7. Confirm manual `Check status` works from the non-blocking state.
8. Confirm failed/abandoned payments still clear pending state and allow a safe retry.

Validation performed in this environment:

- Re-inspected current remote `main`, recent build state, donation mobile/service/web callback code, auth routing, browse services/controllers, and Expo SDK 57 WebBrowser/Linking guidance.
- Expo SDK 57 documents that custom schemes/deep links are supported and Expo Router handles incoming deep links; Paystack requires an HTTPS browser callback, so the HTTPS thank-you page is retained as a short bridge back into the native custom scheme.
- Paystack documentation continues to treat webhooks/server verification as authoritative; the app redirect is not used as proof of payment.
- No schema, migration, payment-secret, or dependency changes were introduced.
- Repository CI status checks are not configured for direct commits; physical-device payment testing remains the acceptance gate.

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
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: return successful mobile Paystack donations back into Pray in Verses and bound automatic verification to 60 seconds before switching to a non-blocking processing state. Status: AWAITING USER TEST.
