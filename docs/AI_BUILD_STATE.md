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

The Reminders + Notifications cycle is engineering-complete with a follow-up Android notification-sound fix:

- A server-backed Notifications inbox uses the existing `/api/notifications` contract, including unread/read state, pull-to-refresh, individual read, mark-all-read, full-message viewing, and optional links.
- Home and Profile navigation now open the real Notifications and Prayer Reminders screens.
- Prayer Reminders are device-local native schedules persisted through Expo SecureStore.
- Users can create, edit, pause/resume, delete, and test reminders with title, time, selected weekdays, and an optional prayer note.
- Active reminders use recurring Expo Notifications schedules, one native schedule per selected weekday.
- Foreground notifications are presented and tapping a prayer reminder routes back to the Reminders screen.
- Reminder edits schedule replacements before cancelling the previous working schedule.
- Android reminder notifications now use the platform default notification sound instead of passing the literal string `default` as a notification-channel sound.
- The Android channel ID was advanced to `prayer-reminders-v2` so devices do not retain the already-created invalid channel sound configuration; Android channel sound settings cannot be changed after channel creation.
- Notification content now uses the platform-default sound flag rather than a custom sound filename.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers accepted.
- Notifications inbox service and screen are engineering-complete.
- Native prayer reminder service, list, editor, permission flow, test notification, and notification-tap handling are engineering-complete.
- Reminder sound configuration fix is pushed and awaiting device confirmation.

## Next Tasks

After user acceptance of Reminders + Notifications:

1. Complete Account backend + Account screen:
   - persisted display-name editing;
   - authenticated password change requiring the current password;
   - account refresh through `/api/auth/me`;
   - DTO validation, security checks, and rate limiting;
   - email remains read-only until a verified email-change flow exists;
   - verify no callers remain for `/api/auth/mobile/login` and remove that stale duplicate route if unused.
2. Complete Support/Donation.
3. Complete remaining About/Mission/Legal product screens and navigation.
4. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
5. Begin iOS build/release work after Android acceptance.

## Known Issues

- Server notifications are an authenticated in-app inbox only; there is no backend push-token registration/storage/delivery path yet.
- Prayer reminders are OS-scheduled without Android's restricted exact-alarm permission and may vary slightly in delivery time.
- Prayer reminders are device-local and do not sync across devices or web.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- The backend still has no persisted profile-update/account-management endpoint; Account management is the next planned cycle.
- `api/src/modules/auth/auth.controller.ts` still contains the older `/auth/mobile/login` route even though the native app uses `/auth/login`; removal is planned for the Account cycle after caller verification.
- Journal entries do not have a structured Scripture-reference field.
- The Journal API has no favorite flag.
- Prayer Wall still has no answered state, request Scripture metadata, or current-user existing like/bookmark state in list/detail responses.

## Testing Status

Previous My Prayers cycle: PASSED per user confirmation.

Current Reminders + Notifications cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, current notification setup, backend Notifications controller/service, and existing web Notifications/Reminders behavior were inspected before implementation.
- Exact Expo SDK 57 Notifications documentation was reviewed.
- User device testing exposed `expo-notifications: Custom sound 'default' not found in native app`.
- Root cause was traced to `sound: 'default'` on the Android notification channel, which was being interpreted as a bundled custom sound filename.
- The fix removes the custom channel sound value, uses a new Android channel ID, and uses the platform-default content sound flag.
- No backend, database migration, dependency, environment-variable, EAS, or `app.json` change was required for the sound fix.
- Physical Android re-test is required before this cycle is accepted.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile decisions.
- Notifications remain split between server-backed inbox messages and local prayer reminders.
- Reminder metadata remains local in SecureStore.
- Recurring reminders use Expo weekly triggers on Android and calendar triggers on iOS.
- Android exact-alarm permission remains intentionally excluded.
- Platform/default notification audio is used unless a real bundled custom sound is intentionally added through the Expo config plugin and a new native build.

## Last Commit

Current handoff includes the Android reminder-sound fix and remains `AWAITING USER TEST`.
