# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Onboarding 1 — Turn Scripture Into Prayer — was accepted by the user on 2026-09-15 after the uploaded Scripture → Prayer image was integrated and reviewed on device.

Previously accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, Cloud Run deployment repair, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Splash

- The JavaScript Splash remains intentionally minimal: clean light background, centered `PIV-logo.png`, and a subtle fade/scale/up settle.
- Existing `/auth/me` session restoration and routing are unchanged.

### Onboarding 1 — Turn Scripture Into Prayer

- Uses the approved image-based Scripture → Prayer artwork.
- Device review passed.
- Title, description, dots, Skip action, and Next behavior remain native.

### Onboarding 2 — Pray Through Every Verse

- The previous code-built straight Book → Chapter → Verse → Prayer ladder has been replaced with the uploaded repository asset `mobile/assets/images/guided-bible-image.png`.
- The new artwork presents the four cards in a zig-zag arrangement with curved snake-like gold connectors.
- The artwork is rendered through a responsive `contain` image stage so it can scale down on shorter phones without changing the surrounding onboarding layout.
- The native title, description, logo, dots, Skip action, and Next action remain unchanged.
- No auth, onboarding state, routing, backend, API, or database logic changed.

### Onboarding 3 — Pray Together

- Existing Prayer Wall community illustration remains unchanged in this cycle.

### Existing signed-in polish retained

- My Prayers uses one floating Add action when the list contains prayers.
- My Prayer editor bottom actions respect Android safe-area navigation.
- Prayer Detail uses the exact web detail photograph and safe-area-aware Save/Journal actions.
- Home uses the web prayer-group hero image and lowered greeting/name copy.
- Donation presets format NGN values deterministically and the donation screen respects safe areas.
- App/native icon configuration points to `PIV-logo.png`; a fresh APK is required to see launcher-icon changes.

## Completed

- Onboarding 1 image-based polish accepted.
- Onboarding 2 uploaded zig-zag card artwork integrated for device review.

## Next Tasks

After Onboarding 2 is visually accepted:

1. Polish Onboarding 3 only if needed.
2. Continue signed-in screen polish screen by screen.
3. Complete remaining About/Mission/Legal native screens and navigation.
4. Finish Android release polish, App Links, launcher/splash checks, and Play Store readiness.
5. Begin iOS release work after Android acceptance.

## Known Issues

- The uploaded Onboarding 2 artwork has a light background rather than transparency, so device review should confirm it blends acceptably with the current warm off-white onboarding surface.
- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Different phone aspect ratios can slightly alter visual spacing; the user's Android device remains the acceptance reference.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.

## Testing Status

Engineering change is pushed for manual Android review.

Test Onboarding 2 and confirm:

1. The uploaded zig-zag Book → Chapter → Verse → Prayer artwork appears instead of the old straight code-built ladder.
2. The curved gold connectors and alternating card positions are clear and visually balanced.
3. The image background blends acceptably with the onboarding screen.
4. The artwork is not clipped or stretched on the target phone.
5. Skip still routes to Login.
6. Next still moves to Onboarding 3.
7. Onboarding 1 remains unchanged and Onboarding 3 remains functional.

Validation performed in this environment:

- Inspected latest `main` and recent commits before editing.
- Read `mobile/AGENTS.md` and the Expo SDK 57 reference before changing mobile code.
- Re-read the current onboarding implementation before replacing the screen-2 visual.
- Reviewed the resulting source structure for unchanged navigation and surrounding onboarding behavior.
- No dependency, schema, migration, environment, API, or native configuration changes were introduced.

A full device render cannot be validated in the GitHub-only environment and remains the manual acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative.
- Decorative onboarding artwork may be committed as an image asset while navigation, headings, buttons, and accessibility-relevant interactions remain native.
- Brand-logo placement uses the actual `PIV-logo.png` asset.

## Last Commit

Current cycle: replace Onboarding 2's straight ladder visual with the uploaded zig-zag guided Bible artwork. Status: AWAITING USER TEST.
