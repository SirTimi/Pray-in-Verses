# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then produce a stable Android preview APK.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The latest accepted mobile polish includes the shared signed-in bottom navigation, justified Prayer Detail Short Insight text, keyboard-safe Add to Journal sheet, Prayer Wall empty/populated creation actions, removal of the Prayer Wall funnel icon, and explicit TSX/JSX TypeScript configuration.

Previously accepted work also includes all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal list floating-add behavior, Journal entry safe-area actions, Prayer Reminders action simplification, My Prayers, Saved Prayers, notifications, account management, Support + Donation, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Prayer Detail action spacing

- The `Save Prayer` / `Add to Journal` action row no longer applies the Android bottom safe-area inset a second time.
- The shared signed-in bottom navigation already owns the device bottom inset, so the Prayer Detail action row now uses a compact fixed 10px bottom padding.
- Button size, Save Prayer behavior, Add to Journal behavior, keyboard-safe journal sheet behavior, and the shared bottom navigation are otherwise unchanged.

### Prayer Detail journal keyboard behavior

- The Add to Journal bottom sheet uses `KeyboardAvoidingView`.
- On Android it uses height-based keyboard avoidance; on iOS it uses padding-based avoidance.
- The reflection input and Save Reflection action should remain visible while typing.

### Prayer Wall creation actions

- No funnel icon is shown.
- A genuinely empty Prayer Wall uses the large `Share a Prayer Request` CTA.
- A populated Prayer Wall uses one lower floating `+` instead.
- Filtered empty views do not reintroduce the large CTA when requests exist elsewhere in the loaded wall.

### TypeScript / JSX configuration

- React component files remain `.tsx` because the app uses TypeScript with JSX.
- `mobile/tsconfig.json` extends Expo's base config and explicitly sets JSX mode to `react-jsx`.
- `.tsx` files should not be renamed to `.jsx` to suppress editor diagnostics.

### Shared signed-in app navigation

- Signed-in screens use one shared bottom navigation owned by the parent `(app)` layout.
- Destinations remain Home, Browse, Pray, Community, and Profile.
- Detail screens retain Stack/back behavior.
- The shared nav hides while the software keyboard is visible and restores when it closes.
- Auth/onboarding screens remain outside the signed-in navigation.

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
- Prayer Detail action-row spacing reduction implemented for device review.

## Next Tasks

After the current spacing adjustment is accepted:

1. Re-run TypeScript/Expo validation locally and clear any remaining real diagnostics.
2. Align the Expo SDK 57 patch versions reported by `expo-doctor` and commit the package/package-lock changes.
3. Verify/fix the EAS project linkage before generating the next preview APK.
4. Complete remaining release polish and Android readiness work.
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

Test and confirm:

1. Open any Prayer Detail screen and scroll to the bottom.
2. The `Save Prayer` and `Add to Journal` buttons sit much closer to the shared bottom navigation, without the large blank band previously visible.
3. The buttons do not overlap the shared bottom navigation.
4. The shared navigation remains fully above the Android system navigation area.
5. Save Prayer still works.
6. Add to Journal still opens the keyboard-safe journal sheet and saves normally.

Validation performed in this environment:

- Re-inspected remote `main`, `mobile/AGENTS.md`, current build state, Prayer Detail, parent `(app)` layout, and shared bottom navigation before editing.
- Confirmed the excess gap came from applying the device bottom inset in both the Prayer Detail footer and the shared bottom navigation.
- Removed only the duplicate footer inset and retained the inset for the journal modal where it is still required.
- No API, database, schema, migration, authentication, payment, dependency, or environment changes were introduced.
- Repository CI status checks are not configured for these direct commits; physical-device review remains the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation remains authoritative for mobile implementation.
- The shared bottom navigation owns the authenticated app's device bottom safe-area inset.
- Screen-local fixed action rows directly above that navigation should not reserve the same bottom inset again.
- `.tsx` remains the standard extension for TypeScript files containing React JSX.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: reduce the spacing between Prayer Detail bottom actions and the shared app navigation by removing duplicate bottom safe-area padding. Status: AWAITING USER TEST.
