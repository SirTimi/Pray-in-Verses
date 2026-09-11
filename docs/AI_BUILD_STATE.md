# AI Build State

## Current Goal

Rework the Pray in Verses mobile application to match the approved reference boards, one testable vertical slice at a time.

## Current Status

AWAITING USER TEST

## Last Accepted Task

Reference Screens 6–10 were accepted by the user on 2026-09-11 after local/device testing.

Accepted behavior now includes:

- Screens 1–5: launch, onboarding, sign in, shared web/mobile authentication endpoints, and session restoration.
- Screens 6–10: Home, Bible Books, Chapter Selection, Verse Selection, and Search.
- Real `/api/browse` data is used for Scripture discovery.
- Main mobile navigation uses Home, Browse, Pray, Community, and More.

## Current Implementation

This development increment implements reference Screens 11–14 as one connected prayer/community slice:

- Screen 11: Prayer Detail driven by `/api/browse/verse/:book/:chapter/:verse`.
- Prayer Detail supports saving/unsaving the whole prayer and individual prayer points through the existing Saved Prayers API.
- Prayer Detail can share the Scripture/prayer using the native share sheet.
- Prayer Detail can create a reflective Journal entry directly through the existing Journals API.
- Screen 12: Prayer Wall replaces the Community placeholder and uses the real `/api/prayer-wall` list, category filtering, likes/prayer count, comments navigation, bookmarks, creator-name hydration, pull-to-refresh, and request creation navigation.
- Screen 13: Prayer Request Detail uses the existing request-detail endpoint, real comments, creator identity, prayer/like toggle, bookmark toggle, and comment creation.
- Screen 14: Create Prayer Request uses the real backend DTO fields: title, description, category, urgent, and anonymous.
- Verse Selection now opens the real Prayer Detail screen instead of the temporary alert.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- Reference Screens 1–10 accepted.
- Reference Screens 11–14 are engineering-complete and awaiting user test.
- Prayer detail service layer added for curated prayer, Saved Prayers, prayer-point saves, and direct Journal creation.
- Prayer Wall mobile service layer added for list/detail/create/like/bookmark/comment and identity lookup.

## Next Tasks

After user acceptance of this increment:

1. Rework reference Screens 15–19: Saved Prayers, Journal, Journal Entry, Profile/Settings, and reusable app states.
2. Bring Signup, Forgot Password, and Reset Password into the same final visual system where needed.
3. Complete My Prayers, reminders, notifications, support/donation, legal screens, and release polish.

## Known Issues

- The Prayer Wall backend has no answered-state field, so the reference `Answered` tab is represented by `Urgent`; `All Requests` and `My Requests` are supported by real data.
- The Prayer Wall list/detail responses do not expose the current user's existing like/bookmark state. Buttons therefore start visually neutral and reflect the authoritative server state after the user taps them. Counts are adjusted from the server toggle result.
- Anonymous requests intentionally have `createdById` removed by the backend. Because of that privacy rule, an anonymous request created by the current user cannot be identified client-side as `My Request` in the list.
- Create Prayer Request does not include the reference design's optional Scripture field because the current backend DTO does not support Scripture fields on PrayerRequest.
- Prayer Detail's Add to Journal action creates a real `Reflective` journal entry directly; the full Journal browsing/editing UX is part of the next screen cycle.
- The current chapter-verses API returns verse numbers only, not Scripture text. Screen 9 continues to show each available verse plus its real prayer-point count.
- Pray and More tabs remain support placeholders for features outside this cycle.

## Testing Status

Previous Screens 6–10 cycle: PASSED per user confirmation.

Current Screens 11–14 cycle:

- Latest `main`, recent commits, `mobile/AGENTS.md`, and this build-state file were inspected before implementation.
- Exact Expo SDK 57 reference documentation was reviewed before mobile changes.
- Backend source contracts were inspected for Curated Prayer detail, Saved Prayers, Journals, Prayer Wall DTO/service/controller, and identity lookup.
- The final diff was reviewed to avoid backend/database/native-build changes in this cycle.
- Full Expo runtime/device validation is not available from the GitHub connector environment; physical Android testing is the acceptance gate.

## Architecture Decisions

- GitHub `main` is the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- Main tab routes remain inside `(app)/(tabs)`; Prayer Detail and Prayer Request Detail/Create routes live outside the Tabs navigator so pushed detail screens do not carry the bottom tab bar.
- Mobile authentication reuses the web auth endpoints and server-managed HTTP-only session cookie.
- Existing backend endpoints are reused rather than creating mobile-specific duplicates.
- Identity display names are resolved through `/api/identity/lookup`; anonymous creator identity is never reconstructed.
- Backend response/DTO shapes are respected as-is. Unsupported answered-state and request Scripture metadata are not fabricated.
- Reference boards guide hierarchy, visual composition, and interaction while real backend capabilities determine behavior.

## Last Commit

Current cycle commit message: `feat(mobile): build prayer detail and community flow`.
