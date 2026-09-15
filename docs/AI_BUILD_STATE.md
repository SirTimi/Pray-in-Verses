# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The repaired API deployment is working.

Accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Splash

- The JavaScript Splash is intentionally minimal again: clean light background, centered `PIV-logo.png`, and a subtle fade/scale/up settle.
- The logo asset already contains the Pray in Verses name and tagline, so no duplicate brand text is rendered in code.
- Existing `/auth/me` session restoration and routing are unchanged.

### Onboarding 1 — Turn Scripture Into Prayer

- The previous code-built Scripture card, Prayer card, and curved arrow composition has been replaced by one image asset at `mobile/assets/images/onboarding/scripture-prayer-art.jpg`.
- That image was created from the approved visual shown by the user, so the card relationship and curved arrow stay visually consistent.
- The artwork is deliberately scaled smaller than before (`82%` width, capped at `310px`) so it no longer dominates the entire screen.
- The page-one logo block is smaller.
- The heading is reduced to `32px` / `36px` line height.
- The description is reduced to `15px` / `21px` line height.
- The page-one Next button is slightly shorter and its label is smaller.
- Skip, dots, Next behavior, onboarding state, and Login routing are unchanged.

### Onboarding 2 and 3

- Existing Book → Chapter → Verse → Prayer and Prayer Wall community implementations are unchanged in this revision.

### Existing signed-in polish retained

- My Prayers uses one floating Add action when the list contains prayers.
- My Prayer editor bottom actions respect Android safe-area navigation.
- Prayer Detail uses the exact web detail photograph and safe-area-aware Save/Journal actions.
- Home uses the web prayer-group hero image and lowered greeting/name copy.
- Donation presets format NGN values deterministically and the donation screen respects safe areas.
- App/native icon configuration points to `PIV-logo.png`; a fresh APK is required to see launcher-icon changes.

No backend, API contract, auth behavior, database schema, dependency, or payment contract changed in this revision.

## Testing Status

Android device review required:

1. Splash should show the simplified PIV logo fade correctly.
2. Onboarding 1 should now feel smaller and less crowded than the previous screenshot.
3. The Scripture + Prayer cards + curved arrow should appear as one image composition, not separately built React Native cards.
4. Heading, description, logo, and button should no longer visually overpower the screen.
5. Skip must still go to Login; Next must still move to Onboarding 2.
6. Onboarding 2 and 3 must remain unchanged and functional.

## Known Issues / Release Notes

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Different phone aspect ratios can slightly alter visual spacing; the user's Android device remains the acceptance reference.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.

## Next Tasks

After Onboarding 1 is visually accepted:

1. Apply the same image-assisted polish approach to Onboarding 2 or 3 only if needed.
2. Continue signed-in screen polish screen by screen.
3. Complete remaining About/Mission/Legal native screens and navigation.
4. Finish Android release polish, App Links, launcher/splash checks, and Play Store readiness.
5. Begin iOS release work after Android acceptance.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative.
- Where exact decorative card compositions are difficult to reproduce reliably with layout code, use a committed image asset while keeping navigation, headings, buttons, and accessibility-relevant interactions native.
- Brand-logo placement uses the actual `PIV-logo.png` asset.

## Last Commit

Current visual target: smaller page-one typography and a single image-based Scripture → Prayer artwork composition. Status remains AWAITING USER TEST.
