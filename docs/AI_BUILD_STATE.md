# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The authentication-polish cycle was accepted by the user on 2026-09-11 after local/device testing.

Accepted behavior now includes:

- All 19 numbered reference-board screens.
- Shared web/mobile authentication using the existing `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout` endpoints.
- Sign In, Sign Up, Forgot Password, and Reset Password using one coherent mobile visual system.
- Real curated-prayer, Saved Prayers, Journal, Prayer Wall, identity, and account data across the accepted mobile flows.

## Current Implementation

This development increment completes My Prayers as a real server-backed mobile vertical slice:

- The existing `Pray` bottom tab now serves as the My Prayers dashboard instead of a placeholder.
- Dashboard stats use `/api/my-prayers/stats` and show Total, Praying, and Answered counts.
- All / Praying / Answered filters use the real `ALL`, `OPEN`, and `ANSWERED` backend states.
- Prayer cards show title, body preview, tags, status, relative update time, and support opening the full editor.
- Search filters the loaded prayer list by title, body, and tags.
- Pull-to-refresh reloads both stats and the selected status list.
- Status can be toggled directly from the list using the real `/api/my-prayers/:id/toggle` endpoint.
- A full-screen create/edit route at `/(app)/my-prayers/[id]` uses the existing create/get/PATCH/delete endpoints.
- New prayers validate non-empty title and body, normalize comma-separated tags, and persist through `/api/my-prayers`.
- Existing prayers can update title/body/tags, toggle OPEN/ANSWERED, and be permanently deleted after confirmation.
- The editor shows the answered date when the backend provides `answeredAt`.
- Loading, empty, error, disabled, and retry states use the existing mobile design system.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication visual polish accepted.
- My Prayers service layer is implemented against the existing backend contract.
- My Prayers dashboard and create/edit/status/delete flow are engineering-complete and awaiting user test.

## Next Tasks

After user acceptance of My Prayers:

1. Complete reminders and notifications as the next focused slice.
2. Complete support/donation and remaining legal/about/mission screens.
3. Finish Android polish, verified App Links, release build checks, and store readiness.
4. Begin iOS build/release work after the Android experience is accepted.

## Known Issues

- Verified Android App Links for password-reset emails are not complete yet. Final verification requires native intent-filter configuration plus the Android signing-certificate association hosted at `prayinverses.com/.well-known/assetlinks.json`; this remains part of Android release polish.
- The backend still has no persisted profile-update endpoint, so Profile intentionally does not offer a fake local-only editor.
- Journal entries do not have a structured Scripture-reference field in the current database/DTO.
- The Journal API has no favorite flag, so unsupported favorite behavior is not fabricated.
- Prayer Wall backend limitations remain: no answered state, no request Scripture metadata, and no current-user existing like/bookmark state in list/detail responses.
- Personal prayer-point bookmarking from the old web page is not copied to mobile because the web implementation is localStorage-only and there is no server contract for it.

## Testing Status

Previous authentication-polish cycle: PASSED per user confirmation.

Current My Prayers cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, and this build-state file were inspected before implementation.
- Exact Expo SDK 57 documentation was reviewed before mobile changes.
- Backend DTO/controller/service contracts and the existing web My Prayer Point page were inspected before implementation.
- The mobile slice reuses only the existing `/my-prayers` endpoints; no backend, database, environment, dependency, EAS, or native configuration changes were required.
- Source-level review was performed for route shapes, API payloads, status values, validation, and ownership-sensitive delete/update behavior.
- Full Expo runtime/device validation is not available from the GitHub connector environment; physical Android testing is the acceptance gate.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- The accepted bottom-tab structure remains Home, Browse, Pray, Community, and Profile; My Prayers replaces the former Pray placeholder without changing the tab route.
- My Prayer create/edit lives outside the Tabs navigator as a full-screen Stack route at `/(app)/my-prayers/[id]`.
- The backend `PrayerStatus` values `OPEN` and `ANSWERED` are represented to users as Praying and Answered.
- Existing backend endpoints are reused rather than introducing mobile-specific duplicates.
- Personal prayer tags are stored through the existing `tags: string[]` field; mobile normalizes comma-separated input before submission.
- Unsupported localStorage-only web bookmarking behavior is not carried into the native app.

## Last Commit

Current cycle handoff includes the My Prayers service, dashboard, full-screen editor, and this build-state update on `main`.
