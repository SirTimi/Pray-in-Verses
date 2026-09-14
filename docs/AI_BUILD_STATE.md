# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The repaired API deployment is working.

Accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, and the user-supplied `PIV-logo.png` branding asset.

## Current Implementation

### Visual polish: Reference Screens 1–5

- Screen 1 JS launch/splash matches the supplied scenic navy/gold reference direction and uses the actual `PIV-logo.png`.
- Screens 2–4 onboarding now use the simpler reference-board hierarchy: Skip, centered serif title/copy, the three matching illustration compositions, three dots, and Next/Get Started.
- Screen 5 Sign In uses `PIV-logo.png`, the white/navy/blue/gold reference composition, and keeps real email/password authentication intact.
- Social sign-in remains visual-only and explicitly explains that OAuth is not connected rather than fabricating support.

### Current polish slice: Home + logo consistency

The signed-in Home screen has been visually refined without changing its real data sources or navigation behavior:

- calmer deep-navy hero with subtler sunrise/hill treatment,
- tighter personalized greeting hierarchy and refined notification button,
- more premium Verse of the Day card with clearer reference/scripture hierarchy and a `Read & pray` cue,
- softer and more consistent Browse Scripture quick-action surfaces,
- stronger Saved Prayers and Journal feature cards,
- Support the Mission now uses the actual Pray in Verses logo instead of a generic heart mark,
- cleaner Prayer Wall preview cards,
- substantially larger bottom content padding so lower content scrolls comfortably above the tab bar.

Logo consistency has also been normalized in `mobile/app.json`:

- top-level Expo app icon now points to `PIV-logo.png`,
- iOS icon now points to `PIV-logo.png`,
- Android adaptive icon foreground now points to `PIV-logo.png` on the warm off-white brand background,
- old adaptive-icon background/monochrome template assets are no longer configured,
- mobile web favicon now points to `PIV-logo.png`,
- native Expo splash already uses `PIV-logo.png` and remains unchanged.

Functional/navigation icons such as Home, Search, Bell, Book, Heart and Profile remain semantic icons. They are not brand-logo surfaces and are intentionally not replaced with the PIV logo.

No backend contract, API endpoint, database schema, authentication behavior, payment behavior, or navigation route changed in this Home/logo polish slice.

## Testing Status

Android device review required:

1. Home should feel calmer and less crowded while retaining the same personalized greeting, real Verse of the Day, Browse actions, Saved Prayers, Journal, Support the Mission and Prayer Wall preview.
2. Verse of the Day should have clearer spacing and hierarchy and still open the correct verse/prayer flow.
3. All four Browse actions should still route correctly.
4. Saved Prayers, Journal and Support the Mission should still open their existing real screens.
5. Lower Home content should scroll fully clear of the bottom tab bar.
6. Support the Mission should show the actual `PIV-logo.png` inside its branded card.
7. A fresh development/release APK is required to judge the launcher/native icon changes in `app.json`; Metro alone is sufficient to review the Home screen polish.
8. After a fresh APK build, verify the PIV logo is legible and safely contained by the Android adaptive-icon mask on the target device.

## Known Issues / Release Notes

- Android adaptive launcher icons apply platform masks and safe zones. The exact `PIV-logo.png` is now configured as requested, but its launcher presentation must be visually reviewed in a fresh APK because full wordmark-style artwork can render smaller than an icon-only mark.
- The native Expo splash and JavaScript launch screen are separate layers.
- `api/package-lock.json` still records mixed NestJS patch versions; the production Docker image normalizes the runtime Nest trio to 11.2.3.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Email editing remains intentionally unavailable until verified email-change support exists.
- The gray floating gear visible in development screenshots belongs to Expo Dev Client, not the app UI.

## Next Tasks

After the current Home/logo polish is accepted:

1. Continue board-by-board polish through the remaining signed-in screens.
2. Complete remaining About/Mission/Legal native screens and navigation.
3. Finish Android release polish, App Links, release build checks and Play Store readiness.
4. Begin iOS release work after Android acceptance.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned docs are authoritative.
- `mobile/assets/images/PIV-logo.png` is the single selected mobile brand-logo asset.
- Brand-logo surfaces use PIV artwork; functional UI icons remain semantic icons for clarity and accessibility.
- Real API data and working navigation take priority over decorative changes during visual polish.

## Last Commit

Current visual target: `polish(mobile): refine home and unify PIV branding`.
