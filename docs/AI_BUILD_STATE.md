# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then produce a stable Android preview APK.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Prayer Detail bottom-action spacing correction is accepted as the reference behavior: `Save Prayer` / `Add to Journal` should sit close to the shared app navigation without reserving the Android bottom safe-area inset twice.

Previously accepted mobile polish also includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, explicit TSX/JSX TypeScript configuration, all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal action patterns, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

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
- Authenticated Stack safe-area ownership audit/fix implemented for device review.

## Next Tasks

After the safe-area audit is accepted:

1. Re-run TypeScript/Expo validation locally and clear any remaining real diagnostics.
2. Align the Expo SDK 57 patch versions reported by `expo-doctor` and commit the resulting package/package-lock changes.
3. Verify/fix the EAS project linkage before generating the next preview APK.
4. Complete remaining Android release polish and Play Store readiness.
5. Begin iOS release work after Android acceptance.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- Different phone aspect ratios can slightly alter spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password reset remain part of Android release polish.
- Local `expo-doctor` reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed before the preview APK is treated as release-ready.
- EAS was previously observed building under a different Expo project; `extra.eas.projectId` must be verified against the intended Pray in Verses project before the next preview build.

## Testing Status

Engineering change is pushed for manual Android review.

Test representative screens that previously had bottom actions or floating buttons:

1. Prayer Detail: `Save Prayer` / `Add to Journal` remain close to the app nav with no overlap.
2. Journal Entry: Save, or Delete + Update, sit directly above the shared nav without a large blank band.
3. Journal list with entries: the floating `+` is near the lower part of the screen without colliding with the nav.
4. Prayer Reminders with reminders: the floating `+` is positioned cleanly above the nav; the reminder editor does not add unnecessary bottom space.
5. My Prayers: the floating add button and prayer editor bottom content do not sit excessively high.
6. Prayer Wall: populated-state floating `+`, create flow, and request detail remain correctly spaced.
7. Support / Donation: bottom content is reachable without excessive safe-area padding.
8. Home, Browse, Pray, Community, and Profile still show exactly one shared bottom navigation and all five destinations still work.
9. The shared nav remains above the Android system navigation area.
10. Open text inputs and confirm keyboard behavior still hides/restores the shared nav correctly.

Validation performed in this environment:

- Re-inspected the latest remote `main`, recent state, `mobile/AGENTS.md`, parent `(app)` layout, shared bottom navigation, and representative Journal, Prayer Reminders, My Prayers, Prayer Wall, Prayer Detail, Donation, and tab screens before editing.
- Reviewed Expo/react-native-safe-area-context guidance confirming that safe-area inset values are relative to the nearest `SafeAreaProvider`.
- Confirmed the shared bottom navigation is a sibling below the authenticated Stack and already handles the real device bottom inset.
- Chose a Stack-level provider so signed-in routed screens no longer independently reserve the same device-bottom inset.
- No API, database, schema, migration, authentication, payment, dependency, or environment changes were introduced.
- Repository CI status checks are not configured for these direct commits; physical-device review remains the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation remains authoritative for mobile implementation.
- The shared bottom navigation owns the authenticated app's physical device bottom safe-area inset.
- Authenticated routed screens calculate safe areas relative to the Stack viewport above that navigation through a nested `SafeAreaProvider`.
- Screen-local visual spacing and content clearance may remain, but routed screens should not independently reserve the device bottom inset again.
- `.tsx` remains the standard extension for TypeScript files containing React JSX.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: audit and fix repeated authenticated-screen bottom safe-area spacing by moving safe-area ownership to the authenticated Stack boundary while leaving the shared app navigation responsible for the real device bottom inset. Status: AWAITING USER TEST.
