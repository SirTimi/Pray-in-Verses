# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Onboarding 3 — Pray Together — and the removal of onboarding page fade/slide transitions were accepted by the user on 2026-09-15 after device review.

Previously accepted product work also includes Onboarding 1, Onboarding 2, the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, Cloud Run deployment repair, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Splash

- The JavaScript Splash remains intentionally minimal: clean light background, centered `PIV-logo.png`, and a subtle fade/scale/up settle.
- Existing `/auth/me` session restoration and routing are unchanged.

### Onboarding 1 — Turn Scripture Into Prayer

- Uses the accepted image-based Scripture → Prayer artwork.
- Title, description, dots, Skip action, and Next behavior remain native.

### Onboarding 2 — Pray Through Every Verse

- Uses the accepted uploaded repository asset `mobile/assets/images/guided-bible-image.png`.
- The artwork presents the four cards in a zig-zag arrangement with curved snake-like gold connectors.

### Onboarding 3 — Pray Together

- Uses the accepted repository asset `mobile/assets/images/prayers-around-the-world.png`.
- The artwork shows a proper globe with prayer/user locations and the Sarah M. and David K. prayer cards layered over it.
- The native title, description, dots, Skip action, and Get Started action remain unchanged.

### Onboarding page transitions

- Page changes are immediate with no page-level fade or upward-slide animation.
- The Splash animation remains unchanged.

### Login

- Email/password login remains the only visible sign-in method.
- The previous Apple, Google, and Facebook placeholder buttons have been removed.
- The `OR CONTINUE WITH` divider has also been removed.
- The unused social-login explanatory alert and related styles/imports were removed with the UI.
- Existing email/password validation, login API call, auth-store update, forgot-password navigation, password visibility toggle, error handling, loading state, and Create an account navigation are unchanged.

### Existing signed-in polish retained

- My Prayers uses one floating Add action when the list contains prayers.
- My Prayer editor bottom actions respect Android safe-area navigation.
- Prayer Detail uses the exact web detail photograph and safe-area-aware Save/Journal actions.
- Home uses the web prayer-group hero image and lowered greeting/name copy.
- Donation presets format NGN values deterministically and the donation screen respects safe areas.
- App/native icon configuration points to `PIV-logo.png`; a fresh APK is required to see launcher-icon changes.

No backend, API contract, auth behavior, database schema, dependency, migration, environment, payment, or native configuration changed in this revision.

## Completed

- Onboarding 1 image-based polish accepted.
- Onboarding 2 zig-zag guided Bible artwork accepted.
- Onboarding 3 globe/prayer artwork accepted.
- Onboarding page-change fade/slide animation removal accepted.
- Social login placeholders removed from Login for device review.

## Next Tasks

After Login social-removal is accepted:

1. Continue auth-screen polish screen by screen.
2. Continue signed-in screen polish screen by screen.
3. Complete remaining About/Mission/Legal native screens and navigation.
4. Finish Android release polish, App Links, launcher/splash checks, and Play Store readiness.
5. Begin iOS release work after Android acceptance.

## Known Issues

- The onboarding artwork files have light backgrounds rather than transparency, so different displays can make the image edges slightly more noticeable.
- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Different phone aspect ratios can slightly alter visual spacing; the user's Android device remains the acceptance reference.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.

## Testing Status

Engineering change is pushed for manual Android review.

Test Login and confirm:

1. The `OR CONTINUE WITH` divider is gone.
2. Apple, Google, and Facebook login buttons are gone.
3. The Create an account prompt now follows the email/password Sign In section cleanly.
4. Email and password entry still work.
5. Password show/hide still works.
6. Forgot password still opens the forgot-password screen.
7. Sign In still authenticates successfully with valid credentials and shows existing error handling for invalid credentials.
8. Create an account still opens Signup.
9. The screen remains visually balanced on the target phone with the social section removed.

Validation performed in this environment:

- Inspected latest `main` and recent commits before editing.
- Confirmed `main` pointed to `cfc60fd177873959cc7689d3d6453ff6f94c0812` before this cycle.
- Read `mobile/AGENTS.md`, `docs/AI_BUILD_STATE.md`, and the Expo SDK 57 reference before changing mobile code.
- Re-read the complete current Login implementation before editing.
- Removed the social UI together with its unused `Alert` import, helper function, and related styles to avoid dead code.
- Preserved the existing email/password authentication and navigation code unchanged.
- No dependency, schema, migration, environment, API, or native configuration changes were introduced.

A full app/device render cannot be validated in this GitHub-only environment and remains the manual acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative.
- Decorative onboarding artwork may be committed as image assets while navigation, headings, buttons, and accessibility-relevant interactions remain native.
- Onboarding page changes should be immediate; no page-level fade/slide transition is applied.
- Login currently exposes only authentication methods that are actually connected to the backend.
- Brand-logo placement uses the actual `PIV-logo.png` asset.

## Last Commit

Current cycle: remove placeholder social login options from the mobile Login screen while retaining email/password authentication and existing auth navigation. Status: AWAITING USER TEST.
