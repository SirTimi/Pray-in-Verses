# AI Build State

## Current Goal

Rework the Pray in Verses mobile application to match the approved reference boards, one testable vertical slice at a time.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Reference Screens 1–5 and authentication repair were accepted on the physical Android development build on 2026-09-11.

Accepted behavior includes:

- Branded launch experience.
- Three-step onboarding flow.
- Redesigned Sign In screen.
- Mobile authentication reusing the web `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout` endpoints.
- Session restoration confirmed by the user after the endpoint repair.

## Current Implementation

This development increment reworks reference Screens 6–10 as one connected Scripture discovery slice:

- Screen 6: authenticated Home using real user state, Verse of the Day, real Prayer Wall preview data, and Scripture quick actions.
- Screen 7: Bible Books/Browse screen driven by `/api/browse/books`, with canonical Bible ordering, Old/New Testament filtering, and book-name filtering.
- Screen 8: Chapter Selection driven by `/api/browse/books/:book/chapters`.
- Screen 9: Verse Selection driven by `/api/browse/books/:book/chapters/:chapter/verses` and the existing per-verse prayer-point counts endpoint.
- Screen 10: Search driven by `/api/browse/search?q=...`, with client-side filters that correspond only to fields the API actually returns: Scripture, Themes, and Prayer Points.
- Bottom navigation now matches the approved reference direction: Home, Browse, Pray, Community, More.
- Pray, Community, and More are intentionally clear support placeholders until their dedicated feature cycles; they do not fake unsupported functionality.

## Completed

- Shared web/mobile authentication endpoints accepted on Android.
- Expo dev client and `react-native-svg` dependency are configured.
- EAS development/preview/production profiles are configured.
- Reference Screens 1–5 accepted.
- Reference Screens 6–10 are engineering-complete and awaiting user test.
- Browse/search mobile service layer added against existing backend endpoints.
- Nested Expo Router Browse stack added so chapter, verse, and search screens retain the main bottom-tab context.

## Next Tasks

After user acceptance of this increment:

1. Rework reference Screens 11–14: Prayer Detail, Prayer Wall, Request Detail, and Create Request.
2. Rework reference Screens 15–19: Saved Prayers, Journal, Journal Entry, Profile/Settings, and reusable app states.
3. Bring Signup, Forgot Password, and Reset Password into the same final visual system where needed.
4. Complete notification, reminder, support/donation, legal, and release polish.

## Known Issues

- The current chapter-verses API returns verse numbers only, not Scripture text. Screen 9 therefore shows each available verse plus its real prayer-point count instead of inventing verse text or issuing an expensive request per verse.
- Tapping a verse on Screen 9 currently selects/highlights it and explains that Prayer Detail is the next build. The real verse-to-prayer navigation will be completed in Screen 11.
- Pray, Community, and More tabs are support placeholders for features outside this cycle. Home links into those placeholders where the reference anticipates future features.
- Prayer Wall list responses currently do not include creator display names, so Home preview cards use request content rather than fabricating author names.
- React Native cookie-session behavior remains device-sensitive; the previously accepted Android login/session test is the current evidence for this development setup.

## Testing Status

Previous authentication cycle: PASSED on physical Android device.

Current Screens 6–10 cycle:

- Source contracts inspected against the actual NestJS controllers/services before implementation.
- Expo Router SDK 57 documentation reviewed for the nested Stack/Tabs routing approach.
- TypeScript/TSX syntax validation performed in the available execution environment. The environment does not contain this project's installed React Native/Expo modules, so full project type resolution/runtime validation is not available here.
- Final physical Android test is required for acceptance.

## Architecture Decisions

- GitHub `main` is the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- The app uses Expo Router file-based navigation with a main Tabs navigator and a nested Browse Stack.
- Mobile authentication reuses the web auth endpoints and server-managed HTTP-only session cookie.
- Browse screens use the existing authenticated `/browse` API family without adding duplicate mobile endpoints.
- Backend response shapes are respected as-is; missing verse-list Scripture text is not fabricated.
- Search filters are limited to actual API-returned fields.
- Reference boards guide composition, spacing, hierarchy, color, and interaction, while unsupported product behavior remains explicitly deferred.

## Last Commit

Current cycle commit message: `feat(mobile): build home and scripture discovery flow`.
