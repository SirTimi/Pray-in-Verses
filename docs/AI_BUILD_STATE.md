# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The user confirmed the repaired API deployment works.

Accepted behavior includes:

- All 19 numbered reference-board screens.
- Shared web/mobile authentication using `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`.
- Sign In, Sign Up, Forgot Password, and Reset Password using one coherent mobile visual system.
- Real curated-prayer, Saved Prayers, Journal, Prayer Wall, My Prayers, identity, notifications, reminders, and account-management flows.
- Persisted display-name updates and authenticated password changes.
- Cloud Run API startup on the aligned NestJS 11.2.3 runtime.

## Current Implementation

The app is now in visual-polish work while the completed Support + Donation flow still awaits final end-to-end payment acceptance.

### Support + Donation already implemented

- Native Help & Support screen using `info@prayinverses.com`.
- Profile and Home both expose Support the Mission.
- Real Paystack initialization, browser handoff, server-authoritative donation status, persisted pending references, and success/failed/pending states.
- Public non-PII `GET /api/donations/:reference/status`.
- Web `/donations/thank-you` callback page.

### Mobile UX repairs already implemented

- Bottom tabs respect the runtime bottom safe-area inset.
- Bottom tabs hide while the software keyboard is open.
- Root Android keyboard avoidance shrinks the usable viewport above the keyboard.
- My Prayers no longer shows duplicate Add Prayer controls: the empty-state CTA is used when the list is empty, and the header `+` is used once prayers exist.

### Current polish slice: Splash + Login

- The official Pray in Verses logo used by the existing web Login (`src/assets/images/prayinverse2.png`) is reused in mobile as `mobile/assets/images/prayinverse-logo.png` rather than the Expo/template-looking mobile icon.
- The native Expo splash uses the official logo on a warm off-white background.
- Expo SDK 57 splash fade is enabled with a short 450ms transition.
- The JavaScript launch screen keeps auth/session restoration behavior unchanged but now animates the official logo with a subtle fade + scale-in and fades the supporting copy in shortly after.
- The launch screen visual system is simplified to warm off-white, pale blue, restrained gold, deep navy text, and the official logo.
- The Login screen now uses the same official logo, removes the duplicate manually rendered brand-name/tagline under the logo, and replaces the old placeholder icon image.
- Login decorative colors are refined to warmer cream, pale brand blue, restrained gold, and deeper navy text.
- Login email/password affordances now use Lucide mail, lock, and eye icons instead of text glyphs.
- Authentication behavior and API contracts are unchanged.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication functional polish accepted.
- My Prayers accepted.
- Notifications and Prayer Reminders accepted, including Android notification sound repair.
- Account backend/mobile Account screen accepted.
- Duplicate mobile-only login endpoint removed.
- Cloud Run startup repaired: Debian/OpenSSL runtime, runtime-safe Nest imports, non-blocking mail verification, and aligned Nest runtime packages.
- Support + Donation implementation completed and awaiting final payment-flow acceptance.
- Android bottom-safe-area, keyboard avoidance, and My Prayers CTA de-duplication implemented.
- Splash + Login visual polish implemented and awaiting device acceptance.

## Next Tasks

After the current visual polish and Support + Donation payment flow are accepted:

1. Continue visual polish screen by screen through onboarding/auth and the main app experience.
2. Complete remaining About/Mission/Legal native screens and navigation.
3. Finish Android release polish, verified password-reset App Links, release build checks, and Play Store readiness.
4. Begin iOS build/release work after Android acceptance.

## Known Issues / Release Notes

- `api/package-lock.json` still records mixed NestJS patch versions. The production Docker image normalizes `@nestjs/common`, `@nestjs/core`, and `@nestjs/platform-express` to exact 11.2.3 and asserts them during build; the lockfile should be regenerated as repository hygiene.
- Donation confirmation depends on Paystack webhook state and can briefly remain Pending after the donor returns.
- Server notifications are an authenticated in-app inbox only; backend remote push-token registration/delivery does not yet exist.
- Prayer reminders are device-local and do not sync across devices or web.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Email editing remains intentionally unavailable until a verified email-change flow exists.
- The native splash asset/configuration changed in the current polish slice, so a new development/release APK is required to judge the true cold-start native splash. Metro alone is sufficient to review the JavaScript launch animation and Login screen.

## Testing Status

Current Splash + Login polish requires Android device review:

- Cold-start native splash should show the Pray in Verses logo rather than the old mobile/template icon after rebuilding the APK.
- Native splash should fade smoothly into the JavaScript launch screen.
- JavaScript launch logo should fade/scale in subtly without delaying session restoration beyond the existing short launch window.
- Existing valid sessions should still restore into the app; signed-out users should still route to onboarding.
- Login should show the official logo, refined cream/blue/gold treatment, and mail/lock/eye controls.
- Login, forgot-password navigation, account creation navigation, and authentication behavior must remain unchanged.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile behavior.
- Web and native clients share one canonical API and session contract.
- Brand artwork already used by the production web Login should be reused rather than inventing a separate mobile logo.
- Native splash configuration and JavaScript launch animation are separate layers: native splash handles cold-start presentation; the JS launch screen handles session restoration and the subtle branded animation.
- Animation should remain short, calm, and functional rather than becoming a long intro.
- App icon/favicon work remains separate from in-app logo presentation unless explicitly included in release polish.

## Last Commit

Current slice: `polish(mobile): refine splash and login branding`.
