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

The Account-management vertical slice remains the current task. Its application code is engineering-complete, but Cloud Run has failed to start the updated API revisions before the HTTP listener becomes ready.

The deployment-repair work now includes:

- The API production image uses `node:22-bookworm-slim` with explicit OpenSSL and CA certificates in build and runtime stages.
- Cloud Run owns the runtime `PORT`; the API image exposes 8080 and Cloud Build deploys the API with `--port=8080`.
- Nest validates the injected port, binds to `0.0.0.0`, and logs bootstrap failures.
- A production-only module-resolution defect in `AuthModule` is fixed: `PrismaModule` now uses the runtime-safe relative import `../../prisma/prisma.module` instead of the TypeScript-only `src/prisma/prisma.module` alias.
- TypeScript CommonJS compilation was verified to emit `require("../../prisma/prisma.module")`, which plain `node dist/main.js` can resolve from the compiled auth module.
- SMTP transport verification no longer blocks Nest module initialization. It is disabled by default and, when explicitly enabled with `MAIL_VERIFY_ON_BOOT=true`, runs asynchronously as diagnostics only.
- Account behavior itself is unchanged by deployment repairs: persisted display-name updates, authenticated password changes, session rotation/revocation, and removal of the stale mobile-only login route remain intact.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers accepted.
- Notifications and Prayer Reminders accepted, including the Android notification sound fix.
- Account backend and mobile Account screen are engineering-complete but not yet accepted.
- Duplicate mobile-only login endpoint removed from the backend.
- First Cloud Run runtime hardening increment completed.
- Runtime-safe AuthModule import and non-blocking mail startup repair completed and awaiting redeploy test.

## Next Tasks

After the Cloud Run deployment succeeds and Account management passes local/device testing:

1. Complete Support/Donation as the next focused vertical slice.
2. Complete remaining About/Mission/Legal product screens and navigation.
3. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
4. Begin iOS build/release work after Android acceptance.

## Known Issues

- Failed Cloud Run revisions `pray-in-verses-api-00032-g2f` and `pray-in-verses-api-00035-j8j` only surfaced the generic `failed to listen on PORT=8080` wrapper in the Cloud Build output supplied for debugging; their container stderr was not included.
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

- Latest `main`, recent commits, `mobile/AGENTS.md`, this build-state file, API Dockerfile, Cloud Build configuration, Nest bootstrap, Prisma startup behavior, AuthModule, MailModule, and Account auth changes were inspected.
- The second supplied deployment log confirms revision `pray-in-verses-api-00035-j8j` also failed before listening on port 8080.
- The backend image build and push complete before the Cloud Run revision failure, so the failure is in container startup rather than Docker image compilation.
- `AuthModule` contained `import { PrismaModule } from 'src/prisma/prisma.module'`. With this repository's CommonJS build and plain `node dist/main.js` runtime, TypeScript preserves that bare module specifier instead of rewriting it to a relative path.
- The repaired AuthModule was syntax-transpiled with TypeScript 5.8.3 with no syntax diagnostics; emitted CommonJS now contains `require("../../prisma/prisma.module")`.
- The repaired MailModule was syntax-transpiled with TypeScript 5.8.3 with no syntax diagnostics.
- Mail verification previously defaulted to synchronous startup verification and could wait on external SMTP timeouts before the HTTP listener opened; it is now non-blocking and opt-in.
- Prisma remains fail-fast during Nest startup so Cloud Run will not mark a revision healthy when its database connection is unusable.
- Docker is not available in the execution environment, so the production image itself cannot be started here. Cloud Run redeployment is the acceptance test.
- No Prisma schema change, migration, mobile dependency, EAS profile, or app native configuration change is part of this repair.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation remains authoritative for mobile decisions.
- Web and native clients share one authentication contract and one canonical session cookie.
- Account-management API behavior remains unchanged by deployment hardening.
- Runtime imports in the Nest API must be relative unless an explicit production runtime alias loader is configured; TypeScript `baseUrl` alone is not a Node.js runtime resolver.
- Optional third-party service verification such as SMTP must not block the HTTP listener during Cloud Run startup.
- Cloud Run owns the runtime `PORT`; the image does not define its own `PORT` environment variable.
- Prisma continues to connect during Nest startup so a revision is not considered healthy when its database/runtime dependencies are unusable.

## Last Commit

Current cycle commit message: `fix(api): remove Cloud Run startup blockers`.
