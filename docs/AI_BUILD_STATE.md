# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The My Prayers cycle was accepted by the user on 2026-09-11 after local/device testing.

Accepted behavior now includes:

- All 19 numbered reference-board screens.
- Shared web/mobile authentication using the existing `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout` endpoints.
- Sign In, Sign Up, Forgot Password, and Reset Password using one coherent mobile visual system.
- Real curated-prayer, Saved Prayers, Journal, Prayer Wall, identity, and account data across the accepted mobile flows.
- My Prayers list/stats/search/filter/create/edit/delete and OPEN/ANSWERED lifecycle through the existing backend contract.

## Current Implementation

This development increment completes the first mobile Reminders + Notifications slice:

- A server-backed Notifications inbox now uses the existing `/api/notifications` contract.
- The inbox normalizes the backend `UserNotification` + nested `notification` response, shows unread/read states, supports pull-to-refresh, opens the full notification body, and opens optional attached links.
- Individual notifications use the preferred `PATCH /api/notifications/:id/read` endpoint.
- “Mark all read” uses `PATCH /api/notifications/read-all`.
- The Home bell now opens the real Notifications inbox.
- Profile & Settings now links to both Notifications and Prayer Reminders.
- Prayer Reminders are implemented as device-local native reminders, matching the existing product behavior where reminders are personal device schedules rather than backend records.
- Reminder metadata is persisted per reminder with Expo SecureStore and an indexed ID list.
- Users can create, edit, pause/resume, and delete reminders with a title, 24-hour time, selected weekdays, and optional prayer note.
- Active reminders are scheduled through Expo Notifications as recurring weekly notifications, one native schedule per selected weekday.
- Android creates a dedicated high-importance `prayer-reminders` notification channel before requesting permission.
- A test action schedules a notification roughly three seconds ahead so physical-device notification behavior can be verified quickly.
- Foreground notification handling is configured at the app root so local reminders can still be presented while the app is open.
- Tapping a prayer-reminder notification routes back to the Prayer Reminders screen, including from the most recent notification response at app startup.
- Reminder updates schedule the new native notifications before cancelling the old schedules, so a failed edit does not destroy the last working schedule.
- Existing Home shortcuts for Saved Prayers and Journal now open their actual screens instead of routing through Profile.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers accepted.
- Notifications inbox service and screen are engineering-complete and awaiting user test.
- Native prayer reminder service, list, editor, permission flow, test notification, and notification-tap handling are engineering-complete and awaiting user test.

## Next Tasks

After user acceptance of Reminders + Notifications:

1. Complete Account backend + Account screen as the next focused vertical slice:
   - add persisted display-name editing for the signed-in user;
   - add authenticated password change requiring the current password;
   - refresh account state through `/api/auth/me`;
   - add appropriate DTO validation, security checks, and rate limiting;
   - keep email read-only until a verified email-change flow exists;
   - verify there are no remaining callers of the stale `/api/auth/mobile/login` route and remove that duplicate route if unused.
2. Complete Support/Donation.
3. Complete remaining About/Mission/Legal product screens and navigation.
4. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
5. Begin iOS build/release work after the Android experience is accepted.

## Known Issues

- Server notifications are currently an authenticated in-app inbox only. The backend has no device push-token registration/storage/delivery path yet, so admin broadcasts do not currently arrive as remote OS push notifications when the app is closed.
- Prayer reminders are scheduled by the operating system without requesting Android’s restricted exact-alarm permission. Delivery is intended for prayer habits and may vary slightly depending on battery/device scheduling behavior.
- Prayer reminders are device-local. They do not sync across devices or the web because the current product has no reminders backend contract.
- Verified Android App Links for password-reset emails are not complete yet. Final verification requires native intent-filter configuration plus the Android signing-certificate association hosted at `prayinverses.com/.well-known/assetlinks.json`; this remains part of Android release polish.
- The backend still has no persisted profile-update/account-management endpoint; Account management is the next planned cycle.
- `api/src/modules/auth/auth.controller.ts` still contains the older `/auth/mobile/login` route even though the native app now uses the shared web `/auth/login` contract. It should be removed in the Account cycle after confirming no callers remain.
- Journal entries do not have a structured Scripture-reference field in the current database/DTO.
- The Journal API has no favorite flag, so unsupported favorite behavior is not fabricated.
- Prayer Wall backend limitations remain: no answered state, no request Scripture metadata, and no current-user existing like/bookmark state in list/detail responses.
- Personal prayer-point bookmarking from the old web page is not copied to mobile because the web implementation is localStorage-only and there is no server contract for it.

## Testing Status

Previous My Prayers cycle: PASSED per user confirmation.

Current Reminders + Notifications cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, this build-state file, current notification plugin/dependency configuration, and relevant mobile navigation were inspected before implementation.
- Exact Expo SDK 57 Notifications documentation was reviewed for permission handling, Android notification channels, weekly/calendar trigger shapes, foreground handlers, notification responses, and current last-response clearing APIs.
- Existing backend Notifications controller/service and the existing web Notifications and Reminders screens were inspected before implementation.
- Notification inbox behavior reuses the current server endpoints and authentication contract unchanged.
- Reminder behavior uses the already-installed `expo-notifications` and `expo-secure-store` packages; no new dependency was introduced.
- No backend, database migration, environment-variable, EAS profile, or `app.json` change was made in this cycle.
- The final diff was reviewed against the accepted My Prayers baseline and contains only the notification/reminder services/screens plus intentional Home/Profile wiring and app-root notification handling.
- Full Expo runtime/physical-notification validation is not available from the GitHub connector environment; physical Android testing is required for acceptance.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- The accepted bottom-tab structure remains Home, Browse, Pray, Community, and Profile.
- Notifications are split by responsibility: server-backed product/admin messages live in the authenticated inbox; personal prayer reminders are native device-local schedules.
- Reminder metadata is stored locally per reminder with SecureStore; scheduled notification identifiers are retained so edits, pauses, and deletes can cancel the correct native schedules.
- Recurring reminders use Expo weekly triggers on Android and calendar triggers on iOS, with weekday values following Expo’s 1=Sunday through 7=Saturday contract.
- Android exact-alarm permission is intentionally not requested for this prayer-habit use case; the OS scheduler remains responsible for delivery timing.
- No fake remote-push behavior is shown until a real server device-token and delivery contract exists.
- Existing backend endpoints are reused rather than introducing mobile-specific duplicates.

## Last Commit

Current cycle handoff is recorded on `main` after the Notifications inbox, native Prayer Reminders flow, Home/Profile wiring, and notification response handling were completed and reviewed.
