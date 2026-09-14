# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The repaired API deployment is working.

Accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Signed-in visual polish

This revision responds to Android screenshots from the user and keeps all existing API behavior intact.

- **My Prayers**
  - The Add Prayer action is now a floating circular `+` button on the right side of the screen instead of living in the page header.
  - The floating action is only shown when prayers already exist; the empty-state Add Prayer button remains the single create action for a completely empty list.
  - The FAB position includes the runtime bottom safe-area inset and stays above the app tab bar/system navigation area.

- **Prayer Detail**
  - The hero now uses the exact image used by the web `VerseDetails.jsx` page: `two-lovers-studying-the-bible-it-is-god-s-love-for-2022-06-18-20-18-08-utc.jpg`.
  - The mobile asset is stored at `mobile/assets/images/prayer/prayer-detail-banner.jpg` using the same Git blob as the web image.
  - The visual hierarchy was simplified: photo hero, compact Theme/Focus strip, one clean Short Insight card, cleaner Prayer Point rows with saved count, and a warm Closing Prayer card.
  - Existing share, whole-prayer save, point save/unsave, and Add to Journal behavior is unchanged.
  - The fixed Save Prayer / Add to Journal action bar now pads itself with `useSafeAreaInsets()` so it stays above Android system navigation.
  - The Journal bottom sheet also respects the bottom safe-area inset.

- **Home**
  - The web Home prayer-group photo remains the banner image.
  - The banner is taller and the greeting, first name, and devotional sentence are moved visibly further down for better visual balance.

No backend, API contract, auth behavior, database schema, dependency, or native configuration changed in this revision.

## Testing Status

Android device review required:

1. My Prayers should show the floating `+` on the right side when at least one prayer exists, with no duplicate header Add action.
2. Prayer Detail should visibly use the same Bible-study photo as the web Prayer Detail page.
3. Prayer Detail should feel lighter and easier to scan while retaining Theme, Insight, Prayer Points, Closing Prayer, save actions, share, and Journal.
4. Save Prayer / Add to Journal must sit fully above the Android navigation bar on the user’s phone.
5. The Journal sheet save control must also remain above the phone navigation area.
6. Home greeting, name, and devotional sentence should sit lower in the photo banner than in the previous screenshot.

## Known Issues / Release Notes

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Email editing remains intentionally unavailable until verified email-change support exists.

## Next Tasks

After this screenshot-driven polish is accepted:

1. Continue signed-in screen visual polish screen by screen.
2. Complete remaining About/Mission/Legal native screens and navigation.
3. Finish Android release polish, App Links, launcher/splash checks and Play Store readiness.
4. Begin iOS release work after Android acceptance.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative.
- `react-native-safe-area-context` runtime insets are used for fixed bottom controls rather than hard-coded Android navigation-bar guesses.
- When the user asks mobile to reuse a web image, the exact repository asset/blob is reused rather than approximated.

## Last Commit

Current visual target: My Prayers FAB, simplified Prayer Detail with web-image parity, bottom-safe actions, and lower Home hero copy.
