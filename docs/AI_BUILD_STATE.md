# AI Build State

## Current Goal

Rework the Pray in Verses mobile application to match the approved reference boards, one testable vertical slice at a time.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Reference Screens 11–14 were accepted by the user on 2026-09-11 after local/device testing.

Accepted behavior now includes:

- Screens 1–5: launch, onboarding, sign in, shared web/mobile authentication endpoints, and session restoration.
- Screens 6–10: Home, Bible Books, Chapter Selection, Verse Selection, and Search.
- Screens 11–14: Prayer Detail, Prayer Wall, Request Detail, and Create Prayer Request.
- Real curated-prayer, Saved Prayers, Journals, Prayer Wall, and identity endpoints are used across the implemented flows.

## Current Implementation

This development increment implements reference Screens 15–19 as the final reference-board slice:

- Screen 15: Saved Prayers, driven by `/api/saved-prayers`, with search, real theme filters, grouped whole-prayer/prayer-point saves, prayer-detail navigation, pull-to-refresh, and complete removal of all saved records for a verse.
- Screen 16: Journal list, driven by `/api/journals`, with search, supported filters, pull-to-refresh, and navigation to create/edit entries.
- Screen 17: Journal Entry create/edit flow using the real journal DTO fields: title, body, and mood. Existing entries can also be deleted.
- Screen 18: Profile & Settings replaces the former More placeholder. It uses the authenticated account state, links to Saved Prayers and Journal, opens existing web legal/help pages, and performs real logout.
- Screen 19: reusable Empty, Loading, and Error state component plus a development-only App States review screen.
- Main bottom navigation now labels the fifth tab `Profile` while retaining the existing route name for navigation stability.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- Reference Screens 1–14 accepted.
- Reference Screens 15–19 are engineering-complete and awaiting user test.
- Saved Prayers mobile service added with grouped saved-state handling.
- Journal mobile service added for list/get/create/update/delete.
- Reusable app-state component added and used by the new library/journal screens.
- All 19 numbered reference-board screens now have an implemented mobile counterpart.

## Next Tasks

After user acceptance of this increment:

1. Bring Signup, Forgot Password, and Reset Password into the final visual system where needed.
2. Complete My Prayers.
3. Complete reminders and notifications.
4. Complete support/donation and remaining legal/about/mission screens.
5. Finish Android polish, App Links verification, release build checks, and store readiness before iOS work.

## Known Issues

- The backend still has no persisted profile-update endpoint. Profile & Settings therefore displays real account data but intentionally does not offer a fake local-only profile editor. The existing web Profile page has the same backend TODO.
- Journal entries do not have a structured Scripture-reference field in the current database/DTO. The mobile Journal Entry screen therefore stores only title, body, and mood rather than pretending the reference design's optional verse field is persisted.
- The Journal API has no favorite flag, so the reference `Favorites` filter is represented by the real supported `Reflective` mood filter.
- Saved Prayers may contain both whole-prayer and individual-prayer-point rows. Mobile groups those rows by curated prayer so the user sees one card per verse; removing that card removes the whole save and all saved-point rows for that verse.
- Notifications remain scheduled for the next completion cycle. The Profile row clearly reports that instead of navigating to fake content.
- Help & Support currently opens the existing public About page because the repository has no dedicated support endpoint/screen yet.
- The Prayer Wall backend limitations from the previous cycle remain: no answered state, no request Scripture metadata, and no current-user existing like/bookmark state in list/detail responses.

## Testing Status

Previous Screens 11–14 cycle: PASSED per user confirmation.

Current Screens 15–19 cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, and this build-state file were inspected before implementation.
- Exact Expo SDK 57 Router documentation was reviewed; `useFocusEffect` is used from `expo-router` for data refresh when returning to Saved Prayers and Journal.
- Backend source contracts were inspected for Saved Prayers, Journals, authenticated user data, My Prayers stats, and the current web Profile/Settings behavior.
- TypeScript/TSX syntax validation was performed in the available execution environment before commit.
- Full Expo runtime/device validation is not available from the GitHub connector environment; physical Android testing is the acceptance gate.

## Architecture Decisions

- GitHub `main` is the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- Main tab routes remain Home, Browse, Pray, Community, and the existing `more` route, now presented to users as Profile for navigation stability.
- Saved Prayers, Journal, Journal Entry, and App States are stack routes outside the Tabs navigator so they can use full-screen flows.
- Mobile authentication continues to reuse web auth endpoints and the server-managed HTTP-only session cookie.
- Existing backend endpoints are reused rather than creating mobile-specific duplicates.
- Backend response/DTO shapes determine behavior; unsupported profile persistence, journal verse metadata, and journal favorites are not fabricated.
- Screen 19 is implemented as a reusable state component, with a development-only visual review route so production users are not exposed to a design-system test page.

## Last Commit

Current cycle finalization: Screens 15–19 implementation on `main`.
