# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Reminders + Notifications cycle, including the Android default-sound channel fix, was accepted by the user on 2026-09-11 after local/device testing.

Accepted behavior now includes:

- All 19 numbered reference-board screens.
- Shared web/mobile authentication using `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`.
- Sign In, Sign Up, Forgot Password, and Reset Password using one coherent mobile visual system.
- Real curated-prayer, Saved Prayers, Journal, Prayer Wall, My Prayers, identity, and account session data across the accepted mobile flows.
- Server-backed notification inbox plus device-local recurring Prayer Reminders.

## Current Implementation

This development increment completes Account management as a backend + mobile vertical slice:

- `PATCH /api/auth/me` now persists the signed-in user's display name.
- Display-name input is validated by DTO and service rules and trimmed before persistence.
- `POST /api/auth/change-password` requires an authenticated session, the current password, and a new password of at least 8 characters.
- Password changes verify the current password with bcrypt and reject reusing the same password.
- A successful password change hashes the replacement password with bcrypt cost 12 and increments `authVersion`, revoking previously issued session tokens on other devices.
- The current caller receives a fresh canonical HTTP-only session cookie immediately after the `authVersion` increment so this device can remain signed in.
- Outstanding unused password-reset tokens are invalidated after an authenticated password change.
- Profile edits are throttled and authenticated password changes have a stricter rate limit.
- The stale `/api/auth/mobile/login` duplicate route has been removed after repository inspection confirmed the native app uses the shared `/api/auth/login` contract and no repository client calls the old route.
- The mobile auth service now exposes real `updateProfile()` and `changePassword()` operations against the shared auth API.
- Profile → Account now opens a real full-screen Account page instead of an unavailable/fake editor.
- The Account screen loads fresh server account data, edits the display name, keeps email explicitly read-only, changes passwords, updates the Zustand user state, and shows server validation/errors.
- The Account screen explains that a password change revokes other existing sessions while retaining the current device session.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers accepted.
- Notifications and Prayer Reminders accepted, including the Android notification sound fix.
- Account backend and mobile Account screen are engineering-complete and awaiting user test.
- Duplicate mobile-only login endpoint removed from the backend.

## Next Tasks

After user acceptance of Account management:

1. Complete Support/Donation as the next focused vertical slice.
2. Complete remaining About/Mission/Legal product screens and navigation.
3. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
4. Begin iOS build/release work after Android acceptance.

## Known Issues

- Email editing remains intentionally unavailable until a verified email-change flow exists; the Account screen shows the current email as read-only.
- Server notifications are an authenticated in-app inbox only; there is no backend push-token registration/storage/delivery path yet.
- Prayer reminders are OS-scheduled without Android's restricted exact-alarm permission and may vary slightly in delivery time.
- Prayer reminders are device-local and do not sync across devices or web.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Journal entries do not have a structured Scripture-reference field.
- The Journal API has no favorite flag.
- Prayer Wall still has no answered state, request Scripture metadata, or current-user existing like/bookmark state in list/detail responses.

## Testing Status

Previous Reminders + Notifications cycle: PASSED per user confirmation, including the follow-up Android notification sound fix.

Current Account management cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, this build-state file, the auth controller/service/DTOs/guard, mobile auth service, Profile screen, and global validation settings were inspected before implementation.
- Repository search plus direct inspection confirmed the current mobile client no longer calls `/auth/mobile/login`; it uses the shared cookie-backed `/auth/login` flow.
- Exact Expo SDK 57 documentation was reviewed before mobile implementation work as required by `mobile/AGENTS.md`.
- No Prisma schema change or database migration is required; existing `User.displayName`, `passwordHash`, and `authVersion` fields support the feature.
- No new dependency, environment variable, EAS profile, or native configuration change is required.
- TypeScript/TSX syntax transpilation was run against all changed TypeScript files with TypeScript 5.8.3 and produced no syntax diagnostics.
- Full Nest/Expo dependency-aware builds and physical Android behavior cannot be executed in the connector environment; the user's local backend + physical-device test is the acceptance gate.
- Because this cycle adds backend endpoints, the API running during the phone test must use this commit. A phone pointed at an older deployed API will return 404 for the new account actions.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation remains authoritative for mobile decisions.
- Web and native clients share one authentication contract and one canonical session cookie; no mobile-only login endpoint is retained.
- `PATCH /auth/me` owns persisted display-name updates and deliberately does not permit email changes.
- Authenticated password change increments `authVersion` to revoke older sessions and immediately rotates the current caller's cookie to the new version.
- Password reset tokens are invalidated when the password changes through the authenticated Account flow.
- Account management lives outside the bottom-tab navigator at `/(app)/account`, opened from Profile.
- Mobile account state is refreshed from `/auth/me`; Zustand mirrors server state rather than acting as the source of truth.

## Last Commit

`1aed794ef046325d266ee04ed584cd391615d063` — `feat(account): add secure account management`
