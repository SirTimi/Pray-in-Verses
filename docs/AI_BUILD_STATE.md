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

The Account-management vertical slice remains the current task. Its application code is engineering-complete, but the first Cloud Run deployment of the updated API failed before the new revision began listening.

The deployment-repair increment now also includes:

- The API production image uses `node:22-bookworm-slim` instead of floating `node:22-alpine`.
- OpenSSL and CA certificates are installed explicitly in both API build and runtime stages because Prisma 6 requires OpenSSL at runtime.
- Build and runtime use the same Debian/OpenSSL family so the generated Prisma native engine matches the production container.
- The Docker image no longer bakes in `PORT=4000`; Cloud Run remains authoritative for the injected `PORT` value.
- The API container exposes port 8080 and `cloudbuild.yaml` explicitly deploys the API service with `--port=8080`.
- Nest parses and validates the injected port before listening on `0.0.0.0`.
- Bootstrap now logs the real startup exception and exits non-zero if initialization fails, so future Cloud Run failures expose their actual cause instead of only the generic port health-check message.
- Account behavior itself is unchanged by this repair: persisted display-name updates, authenticated password changes, session rotation/revocation, and removal of the stale mobile-only login route remain intact.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers accepted.
- Notifications and Prayer Reminders accepted, including the Android notification sound fix.
- Account backend and mobile Account screen are engineering-complete but not yet accepted.
- Duplicate mobile-only login endpoint removed from the backend.
- Cloud Run API startup hardening is engineering-complete and awaiting deployment re-test.

## Next Tasks

After the Cloud Run deployment succeeds and Account management passes local/device testing:

1. Complete Support/Donation as the next focused vertical slice.
2. Complete remaining About/Mission/Legal product screens and navigation.
3. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
4. Begin iOS build/release work after Android acceptance.

## Known Issues

- The exact stderr from failed Cloud Run revision `pray-in-verses-api-00032-g2f` was not included in the original deployment output; Cloud Build only surfaced the generic "failed to listen on PORT=8080" wrapper. The repository-level runtime issue has been hardened, and bootstrap logging will expose any remaining startup exception on the next deploy.
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

Current Account management / deployment-repair cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, this build-state file, API Dockerfile, Cloud Build configuration, Nest bootstrap, Prisma startup behavior, and Account auth changes were inspected.
- The failed Cloud Build reached the Cloud Run deployment step, which confirms the backend image built and pushed successfully; the failure occurred when the new revision attempted to start.
- Source inspection confirms Nest already reads `process.env.PORT` and binds to `0.0.0.0`, so simply increasing the health-check timeout was not treated as a root-cause fix.
- The September 9 API Dockerfile change moved production to Node 22 Alpine without explicitly installing OpenSSL. Prisma 6 requires OpenSSL at runtime, and `PrismaService` connects during Nest module initialization before the HTTP listener starts.
- The repair moves the API to Debian Bookworm slim with explicit OpenSSL and aligns Docker/Cloud Run on port 8080.
- `cloudbuild.yaml` was parsed locally as valid YAML and contains six build/deploy steps with `--port=8080` on the API deployment.
- Docker is not available in the execution environment, so the image itself could not be started here. Cloud Run redeployment is the required acceptance test.
- No Prisma schema change, migration, mobile dependency, EAS profile, or app native configuration change is part of this repair.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation remains authoritative for mobile decisions.
- Web and native clients share one authentication contract and one canonical session cookie.
- Account-management API behavior remains unchanged by deployment hardening.
- The API production container uses a stable Debian slim base with explicit OpenSSL rather than depending on floating Alpine runtime library detection.
- Cloud Run owns the runtime `PORT`; the image does not define its own `PORT` environment variable.
- API startup remains fail-fast on initialization errors, but startup failures are now explicitly logged before process exit.
- Prisma continues to connect during Nest startup so a revision is not considered healthy when its database/runtime dependencies are unusable.

## Last Commit

Current cycle commit message: `fix(api): harden Cloud Run startup runtime`.
