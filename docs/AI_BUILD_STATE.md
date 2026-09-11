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

The Account-management vertical slice remains the current task. Its application code is engineering-complete, but Cloud Run has failed to start updated API revisions before the HTTP listener becomes ready.

The deployment-repair work now includes:

- The API production image uses `node:22-bookworm-slim` with explicit OpenSSL and CA certificates in build and runtime stages.
- Cloud Run owns the runtime `PORT`; the API image exposes 8080 and Cloud Build deploys the API with `--port=8080`.
- Nest validates the injected port, binds to `0.0.0.0`, and logs bootstrap failures.
- A production-only module-resolution defect in `AuthModule` is fixed: `PrismaModule` uses the runtime-safe relative import `../../prisma/prisma.module` instead of the TypeScript-only `src/prisma/prisma.module` alias.
- SMTP transport verification no longer blocks Nest module initialization. It is disabled by default and, when explicitly enabled with `MAIL_VERIFY_ON_BOOT=true`, runs asynchronously as diagnostics only.
- Revision `pray-in-verses-api-00036-h8b` finally exposed the actual Node startup exception: `Cannot find module '@nestjs/common/decorators/http/sse-signal.decorator'` while loading `@nestjs/core/router/router-execution-context.js`.
- The committed API lockfile contains an incompatible mixed Nest runtime set: `@nestjs/common` 11.1.28, `@nestjs/core` 11.2.3, and `@nestjs/platform-express` 11.2.3.
- NestJS 11.2.3 source contains `decorators/http/sse-signal.decorator`, confirming `@nestjs/core` 11.2.3 is loading an internal file absent from the older `@nestjs/common` 11.1.28 installation.
- Both API Docker stages now normalize the runtime Nest trio to exact version 11.2.3 after `npm ci` and execute a build-time assertion that all three installed versions are exactly 11.2.3 before continuing.
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
- Debian/OpenSSL Cloud Run runtime hardening completed.
- Runtime-safe AuthModule import and non-blocking mail startup repair completed.
- Cloud Run NestJS runtime-version alignment repair completed and awaiting redeploy test.

## Next Tasks

After the Cloud Run deployment succeeds and Account management passes local/device testing:

1. Complete Support/Donation as the next focused vertical slice.
2. Complete remaining About/Mission/Legal product screens and navigation.
3. Finish Android polish, verified password-reset App Links, release build checks, and Play Store readiness.
4. Begin iOS build/release work after Android acceptance.

## Known Issues

- `api/package-lock.json` currently records mixed NestJS runtime patch versions (`common` 11.1.28 vs `core`/`platform-express` 11.2.3). The production image now normalizes these packages to 11.2.3 deterministically before build/runtime startup; the lockfile itself should be regenerated as follow-up repository hygiene rather than silently hand-edited.
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

- Latest `main`, this build-state file, API Dockerfile, package manifest/lockfile, Nest bootstrap, Prisma startup behavior, AuthModule, MailModule, and Account auth changes were inspected.
- Revision `pray-in-verses-api-00036-h8b` supplied concrete container stderr rather than only Cloud Run's generic port wrapper.
- The concrete exception occurs inside Nest's package loading before `/app/dist/main.js` reaches application bootstrap: `@nestjs/core/router/router-execution-context.js` requires `@nestjs/common/decorators/http/sse-signal.decorator`, which is missing from the installed common package.
- The committed lockfile was verified to resolve `@nestjs/common` to 11.1.28 while resolving `@nestjs/core`, `@nestjs/platform-express`, and `@nestjs/testing` to 11.2.3.
- The NestJS v11.2.3 source was checked directly and contains `packages/common/decorators/http/sse-signal.decorator.ts`.
- The API Dockerfile now installs `@nestjs/common@11.2.3`, `@nestjs/core@11.2.3`, and `@nestjs/platform-express@11.2.3` with exact versions after each stage's `npm ci`, without rewriting the repository lockfile in the image.
- Both Docker stages now fail during image construction if the installed runtime Nest versions are not exactly 11.2.3, preventing another revision from reaching Cloud Run with this mismatch unnoticed.
- Docker is not available in the execution environment, so the production image itself cannot be started here. Cloud Run redeployment remains the acceptance test.
- No Prisma schema change, migration, mobile dependency, EAS profile, app native configuration, Account API contract, or mobile Account behavior changed in this repair.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation remains authoritative for mobile decisions.
- Web and native clients share one authentication contract and one canonical session cookie.
- Account-management API behavior remains unchanged by deployment hardening.
- Runtime imports in the Nest API must be relative unless an explicit production runtime alias loader is configured; TypeScript `baseUrl` alone is not a Node.js runtime resolver.
- Optional third-party service verification such as SMTP must not block the HTTP listener during Cloud Run startup.
- Nest core runtime packages used together in production must be aligned to one exact patch version instead of relying on independent caret resolution.
- Cloud Run owns the runtime `PORT`; the image does not define its own `PORT` environment variable.
- Prisma continues to connect during Nest startup so a revision is not considered healthy when its database/runtime dependencies are unusable.

## Last Commit

Current cycle commit message: `fix(api): align Nest runtime packages`.
