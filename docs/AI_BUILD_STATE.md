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

- **My Prayers list**
  - The Add Prayer action is a floating circular `+` button on the right side instead of living in the page header.
  - The floating action is only shown when prayers already exist; the empty-state Add Prayer button remains the single create action for a completely empty list.
  - The FAB position includes the runtime bottom safe-area inset and stays above the app tab bar/system navigation area.

- **My Prayer editor**
  - The editor now includes the bottom safe area and adds runtime inset padding below the Save/Add Prayer button.
  - Android keyboard avoidance now uses `height` instead of being disabled.
  - The final action button can be fully scrolled above Android system navigation instead of ending underneath it.

- **Prayer Detail**
  - The hero uses the exact image used by the web `VerseDetails.jsx` page: `two-lovers-studying-the-bible-it-is-god-s-love-for-2022-06-18-20-18-08-utc.jpg`.
  - The mobile asset is stored at `mobile/assets/images/prayer/prayer-detail-banner.jpg` using the same Git blob as the web image.
  - The visual hierarchy is simplified: photo hero, compact Theme/Focus strip, one clean Short Insight card, cleaner Prayer Point rows with saved count, and a warm Closing Prayer card.
  - Existing share, whole-prayer save, point save/unsave, and Add to Journal behavior is unchanged.
  - The fixed Save Prayer / Add to Journal action bar pads itself with `useSafeAreaInsets()` so it stays above Android system navigation.
  - The Journal bottom sheet also respects the bottom safe-area inset.

- **Home**
  - The web Home prayer-group photo remains the banner image.
  - The banner is taller and the greeting, first name, and devotional sentence are moved visibly further down for better visual balance.

### Onboarding 1 visual polish

- The Scripture → Prayer connector is now a custom curved SVG arrow rather than a straight diagonal icon.
- The first onboarding illustration has a stronger transformation flow using a soft blue backdrop, restrained gold glow, Scripture icon treatment, cleaner card overlap, lighter card rotation, and a highlighted Prayer card.
- The copy, navigation, dots, Skip, Next, and onboarding state behavior are unchanged.
- No new dependency or native rebuild is required for this onboarding polish.

### Splash + branding repair

- `mobile/src/app/index.tsx` no longer applies a white tint to `PIV-logo.png`.
- The previous tint turned every pixel in the opaque PNG white, which produced the blank white square seen on Android.
- The actual PIV artwork now renders inside a deliberate rounded light brand plate with shadow instead of an accidental blank square.
- The logo keeps the existing fade/scale entrance and the devotional copy keeps a subtle fade/up transition.
- The splash footer now uses the runtime bottom inset so its small tagline stays above Android navigation.
- `mobile/app.json` already points the general app icon, iOS icon, Android adaptive-icon foreground, web favicon, and native Expo splash image to `PIV-logo.png`.
- A fresh native APK is required before the installed launcher icon can visibly change; Metro/JS reload cannot replace an already-installed Android launcher icon.

### Support the Mission / donation repair

- NGN amounts are now formatted with a deterministic thousands separator instead of relying on runtime `toLocaleString()` behavior.
- Presets render as `₦1,000`, `₦2,000`, `₦5,000`, and `₦10,000`.
- Preset labels use one-line font fitting and a limited font-scale multiplier so large Android accessibility text does not clip the final digit.
- The donation screen now also respects the bottom safe area and uses Android `KeyboardAvoidingView` height behavior.
- Paystack initialization, pending-reference persistence, webhook-backed status checks, success/failure handling, and Donation Policy behavior are unchanged.

No backend, API contract, auth behavior, database schema, dependency, or payment contract changed in this revision.

## Testing Status

Android device review required:

1. Onboarding 1 should show a visibly curved gold connector flowing from the Scripture card toward the Prayer card, with no clipping on the user's device.
2. Splash should display the actual Pray in Verses logo artwork, not a blank white square.
3. Splash logo plate should fade/scale in cleanly and the footer tagline must remain above Android navigation.
4. Support the Mission presets must display the full values: `₦1,000`, `₦2,000`, `₦5,000`, `₦10,000`.
5. My Prayer editor Save Changes/Add Prayer button must be fully visible and scroll above Android system navigation.
6. Prayer Detail Save Prayer / Add to Journal must remain fully above Android navigation.
7. Home greeting, name, and devotional sentence should sit lower in the photo banner than in the previous screenshot.
8. A new development APK is required to judge the launcher icon because launcher/native icon assets are baked into the Android build.

## Known Issues / Release Notes

- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the Pray in Verses application UI.
- Expo SDK 57 documentation notes that development builds do not fully reproduce the final standalone splash-screen experience; release/native builds remain the final splash validation target.
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
- `react-native-safe-area-context` runtime insets are used for fixed/bottom controls rather than hard-coded Android navigation-bar guesses.
- When the user asks mobile to reuse a web image, the exact repository asset/blob is reused rather than approximated.
- Brand-logo placement uses the actual `PIV-logo.png` asset; functional navigation icons remain semantic icons.
- Onboarding illustration polish should use native React Native/SVG composition rather than generated image assets so it stays responsive and editable.

## Last Commit

Current visual target: curved Scripture-to-Prayer onboarding connector and cleaner first onboarding composition, alongside the existing splash, donation, safe-area, and launcher-icon polish awaiting device review.
