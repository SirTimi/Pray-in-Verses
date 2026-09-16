# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth, then produce a stable Android preview APK.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Prayer Reminders action simplification was accepted by the user on 2026-09-16. Prayer Reminders now uses the large `Add Reminder` CTA only when empty, one lower floating `+` when reminders exist, no header `+`, and no `Send a test reminder` control.

Previously accepted work also includes all three onboarding screens, onboarding transition removal, email/password-only Login, Verse of the Day direct-to-detail navigation, Journal list floating-add behavior, Journal entry safe-area actions, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation, keyboard/safe-area repairs, Cloud Run deployment repair, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Prayer Detail — journal keyboard behavior

- The Add to Journal bottom sheet is wrapped in a `KeyboardAvoidingView`.
- On Android the sheet uses height-based keyboard avoidance; on iOS it uses padding-based avoidance.
- The journal sheet should move above the software keyboard so the reflection input and Save Reflection action remain visible while typing.
- Existing prayer loading, Save Prayer, prayer-point saving, sharing, journal persistence, and Short Insight justification are unchanged.

### Prayer Wall creation actions

- The funnel/filter icon has been removed from the Prayer Wall header.
- The large `Share a Prayer Request` CTA is no longer permanently displayed above the request list.
- When the current Prayer Wall result set is truly empty, the large share CTA appears inside the empty state.
- When prayer requests exist, creation is available through one lower floating `+` button instead.
- If an Urgent/My Requests mode has no matches while the loaded wall still has requests, the filtered empty state does not bring back the large CTA; the floating `+` remains available.
- Existing prayer request cards, categories, All/Urgent/My Requests modes, likes/prays, comments, bookmarks, pull-to-refresh, and create/detail routes are unchanged.

### TypeScript / JSX configuration

- React component route files remain `.tsx`. This is intentional: `.tsx` is TypeScript that contains JSX; `.jsx` would be JavaScript with JSX and would remove TypeScript checking.
- `mobile/tsconfig.json` still extends Expo's `expo/tsconfig.base` and now explicitly sets `compilerOptions.jsx` to `react-jsx` so editors/type checking do not fall back to a no-JSX TypeScript mode.
- `baseUrl` is explicitly set to the mobile project root for the existing path aliases.
- After pulling, VS Code may need `TypeScript: Restart TS Server` or a window reload to discard stale diagnostics.

### Shared signed-in app navigation

- Signed-in screens use one shared primary bottom navigation from the parent `(app)` layout.
- The same five destinations remain available: Home, Browse, Pray, Community, and Profile.
- The nested `(tabs)` navigator manages routes but does not render a duplicate tab bar.
- Detail screens retain Stack/back behavior.
- The shared navigation hides while the software keyboard is visible and restores when it closes.
- Authentication and onboarding routes remain outside `(app)` and do not show signed-in navigation.

### Other accepted mobile polish

- Short Insight text is justified.
- Prayer Reminders use state-based add actions.
- Existing Journal entries use Delete and Update Entry side by side above the Android navigation bar.
- Populated Journal lists use one floating lower-right `+`; empty journals use the large New Entry CTA.
- Verse of the Day opens its exact prayer detail route directly.
- Login exposes email/password only.
- All three onboarding screens use their accepted artwork and page changes are immediate.

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
- Shared signed-in navigation and Short Insight justification implemented for device review.
- Prayer Detail journal keyboard avoidance implemented for device review.
- Prayer Wall empty/populated creation-action behavior implemented for device review.
- Explicit TSX/JSX compiler configuration implemented for local editor review.

## Next Tasks

After this polish cycle is accepted:

1. Re-run TypeScript/Expo validation locally and clear any remaining real diagnostics.
2. Align the Expo SDK 57 patch versions reported by `expo-doctor` and commit the resulting package/package-lock changes.
3. Verify/fix the EAS project linkage before generating the next preview APK.
4. Complete remaining About/Mission/Legal native screens and navigation if still required.
5. Finish Android release polish, App Links, launcher/splash checks, and Play Store readiness.
6. Begin iOS release work after Android acceptance.

## Known Issues

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Different phone aspect ratios can slightly alter visual spacing; the user's Android device remains the acceptance reference.
- The onboarding artwork files have light backgrounds rather than transparency, so different displays can make image edges slightly more noticeable.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- The latest local `expo-doctor` run reported Expo SDK 57 patch-version drift; dependency alignment still needs to be completed and committed before the preview APK build is treated as release-ready.
- The user reported that EAS was building under a different Expo project. The existing `extra.eas.projectId` must be verified against the intended Pray in Verses EAS project before the next preview build; do not create or relink a project blindly.

## Testing Status

Engineering changes are pushed for manual Android/local-editor review.

Test and confirm:

1. Open Prayer Detail and tap `Add to Journal`.
2. With the keyboard open, the Prayer Journal sheet rises above it and the text being typed remains visible.
3. `Save Reflection` remains reachable and saves successfully.
4. On Prayer Wall with requests present, the funnel icon and large top share banner are gone.
5. With requests present, one floating `+` appears near the lower part of the Prayer Wall and opens the create-request screen.
6. The floating `+` does not cover the final request card or the shared bottom navigation.
7. On a genuinely empty Prayer Wall result set, the large `Share a Prayer Request` CTA appears inside the empty state instead of the floating `+`.
8. All Requests, Urgent, My Requests, category chips, Pray, Comment, Save, pull-to-refresh, request detail, and create flow still work.
9. After pulling the repo, VS Code no longer reports `Cannot use JSX unless the '--jsx' flag is provided` on `welcome.tsx`. If stale errors remain, run `TypeScript: Restart TS Server` or reload the VS Code window and check again.
10. `.tsx` route/component files continue to compile as TypeScript React files; they should not be renamed to `.jsx`.

Validation performed in this environment:

- Re-inspected remote `main` and recent commits before editing.
- Re-read `mobile/AGENTS.md` and `docs/AI_BUILD_STATE.md`.
- Reviewed the Expo SDK 57 documentation before changing mobile code.
- Inspected the actual Prayer Detail modal, Prayer Wall implementation, shared navigation, `mobile/tsconfig.json`, and `mobile/package.json` from `main`.
- Compared this cycle against commit `f0c62b7e5322d64b9c705229af3c5feb97953c8c`; the implementation changes are limited to Prayer Wall, Prayer Detail journal keyboard handling, and TypeScript JSX configuration, plus this state document.
- No API, database, schema, migration, authentication, payment, or environment changes were introduced.
- Repository CI status checks are not configured for these direct commits; physical-device and local-editor validation remain the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation remains authoritative for mobile implementation.
- `.tsx` is the standard extension for TypeScript files containing React JSX in the mobile application.
- Do not convert `.tsx` screens to `.jsx` to suppress TypeScript diagnostics; fix TypeScript configuration/root causes instead.
- The authenticated application retains one shared primary bottom navigation owned by the parent `(app)` layout.
- The Prayer Wall uses state-based creation UI: large CTA when empty, floating `+` when populated.
- Keyboard-sensitive bottom sheets must keep active text inputs/actions above the software keyboard rather than relying on keyboard overlap behavior.
- Manual user/device testing remains the acceptance gate after each pushed development increment.

## Last Commit

Current cycle: keyboard-safe Prayer Detail journal sheet, Prayer Wall creation-action simplification, and explicit TSX/JSX compiler configuration. Status: AWAITING USER TEST.
