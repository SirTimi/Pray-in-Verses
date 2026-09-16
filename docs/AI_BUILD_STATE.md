# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Prayer Reminders action simplification was accepted by the user on 2026-09-16. Prayer Reminders now uses the large `Add Reminder` CTA only when empty, one lower floating `+` when reminders exist, no header `+`, and no `Send a test reminder` control.

Previously accepted work also includes all three onboarding screens, removal of onboarding page fade/slide transitions, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal list floating-add behavior, Journal entry safe-area actions, the 19 reference-board screens, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation, keyboard/safe-area repairs, Cloud Run deployment repair, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Shared signed-in app navigation

- Signed-in screens now use one shared primary bottom navigation from the parent `(app)` layout.
- The shared navigation exposes the same five destinations everywhere: Home, Browse, Pray, Community, and Profile.
- The nested `(tabs)` navigator remains responsible for the five main tab routes but no longer renders a second tab bar.
- Signed-in detail screens outside `(tabs)` now retain the primary app navigation instead of losing it when pushed on the parent Stack.
- Route-aware active states map Bible browsing to Browse, prayer/journal/saved/reminders flows to Pray, Prayer Wall/community flows to Community, and account/support/notifications flows to Profile.
- The shared navigation hides while the software keyboard is visible and restores when the keyboard closes.
- Existing Stack navigation and screen-level Back actions are preserved.
- Authentication and onboarding routes remain outside `(app)` and therefore do not show the signed-in navigation.

### Prayer Detail — Short Insight

- The Short Insight body now uses justified text alignment for a cleaner block layout.
- Prayer content, API loading, Save Prayer, prayer-point saving, sharing, and Add to Journal behavior are unchanged.

### Prayer Reminders actions

- The top-right Prayer Reminders `+` is removed.
- `Send a test reminder` is removed from the end-user screen.
- Zero reminders use the existing large `Add Reminder` empty-state CTA.
- Populated reminder lists use one lower floating `+` action.
- Reminder permission prompts, local scheduling, editing, active/paused toggles, and delete confirmation are unchanged.

### Journal entry actions

- Existing Journal entries do not show a trash icon in the header.
- Existing entries show `Delete` and `Update Entry` side by side in a persistent bottom action area.
- New entries show one `Save Entry` action.

### Journal list actions

- Populated Journal lists show one floating lower-right `+` action.
- The top-right `+` is removed.
- The large full-width `New Entry` CTA appears only when the journal has zero entries.

### Home — Verse of the Day

- Verse of the Day and Daily Verse open the exact prayer detail route directly.
- Manual Bible book → chapter → verse browsing retains the normal selection flow.

### Login

- Email/password login is the only visible sign-in method.

### Onboarding

- All three onboarding screens use their accepted artwork.
- Page changes are immediate with no page-level fade/upward-slide animation.

## Completed

- Onboarding 1 artwork accepted.
- Onboarding 2 zig-zag guided Bible artwork accepted.
- Onboarding 3 globe/prayer artwork accepted.
- Onboarding transition fade/slide removal accepted.
- Login social-login placeholder removal accepted.
- Verse of the Day direct-to-detail navigation accepted.
- Journal list add-action layout accepted.
- Journal entry delete/update bottom action layout accepted.
- Prayer Reminders action simplification accepted.
- Shared signed-in app navigation and Short Insight justification implemented for device review.

## Next Tasks

After the shared navigation and Short Insight polish are accepted:

1. Finish any remaining signed-in screen polish found during the full navigation pass.
2. Re-run Expo dependency alignment/doctor checks before generating the preview APK.
3. Complete remaining About/Mission/Legal native screens and navigation.
4. Finish Android release polish, App Links, launcher/splash checks, and Play Store readiness.
5. Begin iOS release work after Android acceptance.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Different phone aspect ratios can slightly alter visual spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency, so different displays can make image edges slightly more noticeable.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- The latest local `expo-doctor` run reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed and committed before the preview APK build is treated as release-ready.

## Testing Status

Engineering change is pushed for manual Android review.

Test the signed-in app and confirm:

1. The Prayer Detail `Short Insight` text is justified and remains readable without clipping or broken spacing.
2. Home, Browse, Pray, Community, and Profile show one consistent bottom navigation bar.
3. There is never a duplicate tab bar on the five main tab screens.
4. The same bottom navigation remains visible on signed-in detail screens, especially Prayer Detail, Journal, Journal Entry, Prayer Reminders, Saved Prayers, My Prayers, Account, Support, Notifications, and Prayer Wall detail/create flows.
5. Home, Browse, Pray, Community, and Profile can each be opened from those detail screens.
6. Back buttons still return to the expected previous screen and no existing detail route is broken.
7. The active navigation item is sensible for each flow: Browse for Bible browsing, Pray for prayer/journal/saved/reminders, Community for Prayer Wall/community, and Profile for account/support/notifications.
8. Fixed screen actions such as Prayer Detail `Save Prayer` / `Add to Journal` and Journal `Delete` / `Update Entry` remain usable above the shared app navigation and Android system navigation.
9. Opening the keyboard hides the shared navigation so text-entry screens are not cramped; dismissing the keyboard restores it.
10. Authentication, signup, forgot-password, splash, and onboarding screens do not show the signed-in navigation.

Validation performed in this environment:

- Inspected the latest remote `main` and recent commits before editing.
- Read `mobile/AGENTS.md`, `docs/AI_BUILD_STATE.md`, the parent `(app)` layout, nested `(tabs)` layout, Prayer Detail implementation, route tree, and existing navigation styling.
- Reviewed Expo Router SDK 57 navigation/layout guidance before changing the navigator structure.
- Confirmed the navigation inconsistency came from signed-in detail routes living in the parent Stack outside the nested Tabs navigator.
- Kept the parent Stack so existing push/back semantics remain intact instead of moving every detail route into individual tab directories.
- Reused the existing five primary destinations, colors, labels, icon family, sizing, safe-area behavior, and keyboard-hide behavior in the shared navigation.
- No API, database, schema, migration, authentication, payment, or environment changes were introduced.
- Repository CI status checks are not configured for these direct commits; physical-device navigation and layout remain the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation remains authoritative for mobile implementation.
- The authenticated application has one shared primary bottom navigation owned by the parent `(app)` layout so it remains consistent across main and detail screens.
- The nested Tabs navigator manages the five primary route groups but does not render its own separate tab bar.
- The parent Stack remains in place to preserve detail-screen Back behavior and route history.
- Signed-in navigation hides while the keyboard is open, matching the previous `tabBarHideOnKeyboard` behavior.
- Authentication/onboarding routes remain navigation-free because they are intentionally outside the authenticated `(app)` layout.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: justify Prayer Detail Short Insight text and make the five-item primary app navigation persistent and consistent across all authenticated screens while preserving existing Stack/back behavior. Status: AWAITING USER TEST.
