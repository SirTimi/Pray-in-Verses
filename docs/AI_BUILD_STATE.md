# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The repaired API deployment is working.

Accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Splash polish — simplified brand-first direction

The user rejected the full sunrise/mountain Splash treatment and asked to restart the Splash from a much simpler base before continuing the onboarding polish.

- `mobile/src/app/index.tsx` no longer uses the generated sunrise/mountain background image.
- The Splash now uses a clean white background with the existing `PIV-logo.png` brand lockup centered on screen.
- Because `PIV-logo.png` already includes the Pray in Verses name and the “Pray the Bible Verse by Verse” tagline, the screen does not duplicate those elements with separate text.
- The complete logo/name/tagline lockup fades in, scales gently from 92% to 100%, and settles upward by 8px for a restrained entrance.
- The Splash remains visible for at least 1.65 seconds so the animation can be perceived without feeling like a long intro.
- Existing `/auth/me` session restoration and routing to the signed-in app or onboarding are unchanged.
- Status-bar content is dark to suit the clean white Splash background.

### Onboarding visual target retained for later polish

- Onboarding 1 remains Turn Scripture Into Prayer.
- Onboarding 2 remains Pray Through Every Verse.
- Onboarding 3 remains Pray Together.
- Skip, Next, Get Started, page state, page-change fade, Login routing, and authentication behavior remain functional.
- Further onboarding changes are paused until the simplified Splash is accepted.

### Existing signed-in polish retained

- My Prayers uses one floating Add action when the list contains prayers.
- My Prayer editor bottom actions respect Android safe-area navigation.
- Prayer Detail uses the exact web detail photograph and safe-area-aware Save/Journal actions.
- Home uses the web prayer-group hero image and lowered greeting/name copy.
- Donation presets format NGN values deterministically and the donation screen respects safe areas.
- App/native icon configuration points to `PIV-logo.png`; a fresh APK is required to see launcher-icon changes.

No backend, API contract, auth behavior, database schema, dependency, or payment contract changed in this Splash polish.

## Testing Status

Android device review required:

1. Splash should have no background image or decorative scenery.
2. The `PIV-logo.png` lockup should appear centered on a clean white background.
3. Logo/name/tagline should fade and scale in smoothly without a visible white square/card boundary.
4. Splash must still restore the current session and route correctly.
5. If the user is signed out, the app should continue to Onboarding 1 after the Splash.

## Known Issues / Release Notes

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not Pray in Verses.
- The first native cold-start frame still comes from Expo splash configuration; the JavaScript Splash can be reviewed immediately through Metro.
- A fresh native APK is required to validate compiled launcher-icon/native-splash changes.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.

## Next Tasks

After the simplified Splash is accepted:

1. Polish Onboarding 1 against the chosen visual direction.
2. Polish Onboarding 2.
3. Polish Onboarding 3.
4. Continue signed-in visual polish screen by screen.
5. Complete remaining About/Mission/Legal native screens and Android release readiness.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative.
- Splash should begin from a minimal brand-first composition before adding any decorative imagery.
- Session/auth/navigation behavior must remain native and functional during visual polish.
- Brand-logo placement uses the actual `PIV-logo.png` repository asset.

## Last Commit

Current visual target: clean white Splash with centered PIV brand lockup and subtle fade/scale entrance. Status remains AWAITING USER TEST.
