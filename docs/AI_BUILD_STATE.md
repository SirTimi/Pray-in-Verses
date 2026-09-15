# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Login social-login cleanup was accepted by the user on 2026-09-15. The mobile Login screen now exposes email/password authentication only; the Apple, Google, Facebook, and `OR CONTINUE WITH` placeholder UI is removed.

Previously accepted work also includes all three onboarding screens, removal of onboarding page fade/slide transitions, the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, Cloud Run deployment repair, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Onboarding

- Onboarding 1 uses the accepted Scripture → Prayer artwork.
- Onboarding 2 uses `mobile/assets/images/guided-bible-image.png` with the accepted zig-zag guided Bible flow.
- Onboarding 3 uses `mobile/assets/images/prayers-around-the-world.png`.
- Page changes are immediate with no page-level fade/upward-slide animation.
- Splash animation remains unchanged.

### Login

- Email/password login is the only visible sign-in method.
- Existing validation, login API call, auth-store update, forgot-password navigation, password visibility toggle, error/loading handling, and Create an account navigation are unchanged.

### Home — Verse of the Day

- Home loads the current Verse of the Day through the existing `getVerseOfTheDay()` service.
- The Verse of the Day card and the existing Daily Verse quick action share the `openVerse` navigation handler.
- `openVerse` now routes directly to the existing verse/prayer detail route `/(app)/prayer/[book]/[chapter]/[verse]` with the current verse's book, chapter, and verse parameters.
- The previous behavior routed first to the chapter verse-selection screen; that intermediate step is removed for the daily verse flow.
- The existing Prayer Detail screen continues to load the actual prayer through `getPrayerDetail(book, chapter, verse)`.
- No Verse of the Day API, prayer-detail API, database, or content behavior changed.

### Existing signed-in polish retained

- My Prayers uses one floating Add action when the list contains prayers.
- My Prayer editor bottom actions respect Android safe-area navigation.
- Prayer Detail uses the web detail photograph and safe-area-aware Save/Journal actions.
- Home uses the prayer-group hero image and existing Home layout.
- Donation presets format NGN values deterministically and Donation respects safe areas.
- App/native icon configuration points to `PIV-logo.png`.

## Completed

- Onboarding 1 image-based polish accepted.
- Onboarding 2 zig-zag guided Bible artwork accepted.
- Onboarding 3 globe/prayer artwork accepted.
- Onboarding page-change fade/slide removal accepted.
- Login social-login placeholder removal accepted.
- Verse of the Day direct-to-detail navigation implemented for device review.

## Next Tasks

After the Verse of the Day navigation is accepted:

1. Continue Home and signed-in screen polish screen by screen.
2. Continue auth-screen polish where needed.
3. Complete remaining About/Mission/Legal native screens and navigation.
4. Finish Android release polish, App Links, launcher/splash checks, and Play Store readiness.
5. Begin iOS release work after Android acceptance.

## Known Issues

- The onboarding artwork files have light backgrounds rather than transparency, so different displays can make image edges slightly more noticeable.
- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Different phone aspect ratios can slightly alter visual spacing; the user's Android device remains the acceptance reference.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.

## Testing Status

Engineering change is pushed for manual Android review.

Test Home and confirm:

1. Load Home while a Verse of the Day is available.
2. Tap the Verse of the Day card / `Read & pray` area.
3. Confirm it opens that exact verse's Prayer Detail screen directly instead of opening the chapter verse-selection screen first.
4. Confirm the Prayer Detail reference and Scripture match the Verse of the Day shown on Home.
5. Press Back and confirm navigation returns to Home normally.
6. Tap the `Daily Verse` quick action and confirm it opens the same current verse detail directly.
7. Confirm Bible Books and normal chapter/verse browsing still retain their existing selection flow.

Validation performed in this environment:

- Inspected latest remote `main` and recent commits before editing.
- Confirmed `main` pointed to `e39b28dcd6fb6897852957bd228d6278014f2586` before this cycle.
- Read `mobile/AGENTS.md`, `docs/AI_BUILD_STATE.md`, and the Expo Router navigation guidance before changing mobile code.
- Inspected `HomeScreen`, the chapter verse-selection screen, and the existing `PrayerDetailScreen` route before editing.
- Confirmed the Prayer Detail route accepts exactly `book`, `chapter`, and `verse` route parameters and loads its data using those values.
- The implementation changes only the Home navigation pathname; no API, service, schema, dependency, migration, environment, authentication, or native configuration changed.
- No repository CI checks are currently configured for these direct commits; physical-device navigation remains the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation.
- Verse of the Day should deep-link directly to its existing verse/prayer detail screen because the verse is already known; users should not be forced through the chapter verse picker again.
- Manual book → chapter → verse browsing keeps the existing selection flow.
- Login exposes only authentication methods actually connected to the backend.
- Onboarding page changes remain immediate.
- Brand-logo placement uses the actual `PIV-logo.png` asset.

## Last Commit

Current cycle: route the Home Verse of the Day / Daily Verse action directly to the existing verse Prayer Detail screen. Status: AWAITING USER TEST.
