# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The repaired API deployment is working.

Accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, and the user-supplied `PIV-logo.png` branding asset.

## Current Implementation

### Visual-polish cycle

The current visual cycle is still under user review.

Completed before this revision:

- Screens 1–5 were rebuilt around the supplied reference board.
- Splash and Sign In use `PIV-logo.png`.
- The signed-in Home screen was given a first polish pass while preserving real API data and navigation.
- Native logo configuration was aligned to the selected PIV artwork.

### Home banner revision

The user requested a more visible Home-screen change and specifically asked for the mobile banner to use the same image as the web Home banner.

Implemented in this revision:

- Verified the actual web Home implementation before changing mobile.
- Reused the exact web hero asset:
  `src/assets/images/home/hero/a-group-of-young-christians-holding-hands-in-praye-2025-03-26-18-07-58-utc.jpg`.
- Added that same Git blob to the mobile asset tree as `mobile/assets/images/home/hero-prayer-group.jpg`; no substitute or generated image is used.
- Replaced the mobile Home banner's abstract sun/hill artwork with the real web prayer-group image.
- Added a navy overlay so white greeting text remains readable while the photograph is still clearly visible.
- Moved the greeting, first name, notification row and devotional banner sentence visibly lower in the banner.
- Increased the banner height slightly so the lower placement does not crowd the Verse of the Day overlap.
- Preserved the existing Verse of the Day, Browse, Saved Prayers, Journal, Support, Prayer Wall, refresh and navigation behavior.
- No backend, API contract, authentication, routing destination, database schema or native dependency changed.
- Exact Expo SDK 57 documentation was re-read before this mobile revision.

## Testing Status

Android device review required:

1. Home should now show the same young-Christians-praying image used by the web Home banner.
2. The greeting, first name and `A new day. A new verse. A deeper prayer life.` copy should sit noticeably lower than in the previous mobile version.
3. White copy and the notification button should remain readable against the photograph.
4. Verse of the Day should still overlap the bottom of the banner cleanly.
5. Pull-to-refresh and all Home navigation targets should continue to work.
6. Support the Mission should still use the selected `PIV-logo.png`.

## Known Issues / Release Notes

- The native Expo splash and the JavaScript launch screen are separate layers.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Email editing remains intentionally unavailable until verified email-change support exists.
- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the app UI.

## Next Tasks

After the current visual revision is accepted:

1. Continue signed-in screen visual polish board by board.
2. Complete remaining About/Mission/Legal native screens and navigation.
3. Finish Android release polish, App Links, launcher/splash checks and Play Store readiness.
4. Begin iOS release work after Android acceptance.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned docs are authoritative.
- The actual supplied `PIV-logo.png` is the selected in-app logo.
- The web Home source is authoritative when the user asks mobile to reuse the web banner image.
- Reference fidelity takes priority during visual polish while unsupported backend behavior must not be fabricated.

## Last Commit

Current visual target: Home banner web-image parity and vertical-copy adjustment.
