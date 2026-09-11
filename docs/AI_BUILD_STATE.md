# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The user confirmed the repaired API deployment works and asked to move to the next build cycle.

Accepted behavior now includes:

- All 19 numbered reference-board screens.
- Shared web/mobile authentication using `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`.
- Sign In, Sign Up, Forgot Password, and Reset Password using one coherent mobile visual system.
- Real curated-prayer, Saved Prayers, Journal, Prayer Wall, My Prayers, identity, notifications, reminders, and account-management flows.
- Persisted display-name updates and authenticated password changes.
- Cloud Run API startup on the aligned NestJS 11.2.3 runtime.

## Current Implementation

The Support + Donation vertical slice is engineering-complete and awaiting physical-device/payment-flow testing.

This slice includes:

- Profile → Help & Support now opens a native mobile Support screen instead of the old website About fallback.
- The Support screen uses the existing official `info@prayinverses.com` contact address and links to the Pray in Verses website and Donation Policy.
- Profile now has a dedicated Support the Mission entry.
- The mobile donation flow uses the existing Paystack-backed `/api/donations/initialize` contract.
- Signed-in account email/display name prefill the donation form but can be adjusted for the donation.
- Preset and custom NGN amounts are supported, with the server minimum of ₦100 enforced client-side and server-side.
- Optional donor name and message are forwarded through the existing donation metadata path.
- Mobile donations are marked with server-controlled source metadata `mobile`; existing web callers continue to default to `web`.
- Paystack opens in `expo-web-browser`; the app never treats opening/closing the browser as proof of payment.
- A new public `GET /api/donations/:reference/status` endpoint exposes only reference, amount, currency, status, createdAt, and paidAt. It does not expose donor email, name, message, gateway payloads, or other PII.
- The mobile app polls the server while a donation is pending, rechecks when the app returns to the foreground, and provides manual Refresh status.
- The current pending donation reference is persisted with SecureStore so confirmation can resume after the app is restarted.
- Confirmed success and failed/abandoned states clear the persisted pending reference.
- The missing public web `/donations/thank-you` callback page now exists so Paystack no longer returns donors to an undefined SPA route.
- The web thank-you page does not independently claim transaction success; it tells the donor that server confirmation may take a moment and mobile donors can return to the app.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers accepted.
- Notifications and Prayer Reminders accepted, including the Android notification sound fix.
- Account backend/mobile Account screen accepted.
- Duplicate mobile-only login endpoint removed.
- Cloud Run startup repaired: Debian/OpenSSL runtime, runtime-safe Nest imports, non-blocking mail verification, and aligned Nest runtime packages.
- Support + Donation implementation completed and awaiting test acceptance.

## Next Tasks

After Support + Donation passes device/payment testing:

1. Complete remaining About/Mission/Legal product screens and native navigation.
2. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
3. Begin iOS build/release work after Android acceptance.

## Known Issues

- `api/package-lock.json` still records mixed NestJS patch versions. The production Docker image normalizes `@nestjs/common`, `@nestjs/core`, and `@nestjs/platform-express` to exact 11.2.3 and asserts them during build; the lockfile should be regenerated cleanly as repository hygiene rather than hand-edited.
- Donation confirmation depends on Paystack webhook state. A user returning before the webhook arrives may briefly see Pending and can refresh until the server confirms the transaction.
- `WebBrowser.openBrowserAsync` resolves as soon as the custom tab opens on Android, so browser state is deliberately not used as transaction state. Server status is authoritative.
- The Donation model field is still named `amountNGN` although current donation code stores Paystack kobo in it; this slice preserves the existing storage contract and converts it back to Naira only in the public status response.
- Email editing remains intentionally unavailable until a verified email-change flow exists.
- Server notifications are an authenticated in-app inbox only; there is no backend push-token registration/storage/delivery path yet.
- Prayer reminders are device-local and do not sync across devices or web.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Journal entries do not have a structured Scripture-reference field and the Journal API has no favorite flag.
- Prayer Wall still has no answered state, request Scripture metadata, or current-user existing like/bookmark state in list/detail responses.

## Testing Status

Previous Account / deployment-repair cycle: PASSED per user confirmation that the repaired Cloud Run API works.

Current Support + Donation cycle:

- Latest `main`, `mobile/AGENTS.md`, Expo SDK 57 WebBrowser documentation, donation controller/service/schema, existing web donation component, Donation Policy, mobile API client, and Profile screen were inspected before implementation.
- The existing backend already creates high-entropy `PIV_...` Paystack references, stores donation state, verifies webhook signatures with SHA-512 HMAC, validates successful gateway amount/currency/status, and records successful/failed results.
- The new status endpoint is rate-limited and accepts only Pray in Verses-shaped references; it returns a minimal non-PII projection of the database row.
- Mobile transaction success is never inferred from a WebBrowser result.
- No Prisma schema change or migration is part of this cycle.
- `expo-web-browser` and `expo-secure-store` were already present in the Expo SDK 57 app, so no native dependency or APK rebuild is required for the mobile code itself.
- API and web changes do require deployment before the complete production donation flow can be accepted.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation remains authoritative for mobile decisions.
- Web and native clients share one canonical API and session contract.
- Paystack and the server-side webhook/database state are authoritative for donation confirmation.
- The mobile client receives only the minimum transaction state necessary to confirm its high-entropy donation reference.
- Payment card/bank details remain entirely outside Pray in Verses and are handled by Paystack.
- The app uses the existing HTTPS Pray in Verses callback origin rather than adding an unverified custom-scheme payment callback.

## Last Commit

Current cycle commit message: `feat: add mobile support and donation flow`.
