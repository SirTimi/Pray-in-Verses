# AI Build State

## Current Goal

Rework the Pray in Verses mobile application to match the approved four-screen reference boards, one testable vertical slice at a time.

## Current Status

AWAITING USER TEST

## Last Accepted Task

None recorded under the new repository-driven acceptance workflow. The first redesigned onboarding/sign-in increment is still under acceptance because the initial phone test exposed an authentication endpoint mismatch.

## Current Implementation

The current development increment contains reference Screens 1–5 and the authentication fix from the first device test:

- Branded launch screen.
- Three-step onboarding flow inspired by the approved reference: Scripture to Prayer, verse-by-verse prayer flow, and Prayer Wall/community.
- Functional Sign In screen matching the new visual direction.
- Mobile Sign In now reuses the same `/api/auth/login` endpoint as the web application instead of `/api/auth/mobile/login`.
- All mobile API requests include credentials so the API-managed HTTP-only auth cookie can be used for protected requests.
- Login is verified immediately with `/api/auth/me` before the app treats the session as authenticated.
- Launch/session restoration now calls `/api/auth/me` directly, matching the web session contract.
- Logout continues to use the shared `/api/auth/logout` endpoint.
- Social sign-in controls shown in the reference remain intentionally omitted because the repository has no social-auth backend contract.

## Completed

- Shared web/mobile signup, forgot-password, reset-password, `/auth/me`, and logout contracts exist.
- Reference Screen 1 launch experience implemented.
- Reference Screens 2–4 onboarding experience implemented.
- Reference Screen 5 sign-in experience implemented.
- Failed `/api/auth/mobile/login` dependency removed from the mobile client.
- Expo dev client and `react-native-svg` are now declared in the mobile package configuration.
- EAS development/preview/production profiles are configured.

## Next Tasks

After user acceptance of the authentication fix:

1. Rework reference Screens 6–10: Home, Bible Books, Chapter Selection, Verse Selection, and Search.
2. Rework reference Screens 11–14: Prayer Detail, Prayer Wall, Request Detail, and Create Request.
3. Rework reference Screens 15–19: Saved Prayers, Journal, Journal Entry, Profile/Settings, and reusable app states.
4. Bring remaining auth screens (Signup, Forgot Password, Reset Password) into the same visual system where needed.

## Known Issues

- Home is still the existing authenticated placeholder and is intentionally outside this acceptance cycle.
- Signup, forgot-password, and reset-password retain their previous styling until a later focused redesign increment.
- React Native 0.86 documents cookie-based authentication as unstable in some native networking scenarios. This implementation intentionally mirrors the web authentication endpoints at the user's request, and the physical Android test must verify both immediate login and session persistence after fully closing/reopening the app. If cookie persistence proves unreliable, the fallback architecture should still keep `/auth/login` as the single login endpoint while returning a native token through that same contract rather than restoring a separate `/auth/mobile/login` route.

## Testing Status

First physical Android test: FAILED.

Observed failure:

- Sign In returned `Cannot POST /api/auth/mobile/login`.

Root cause:

- The mobile client depended on a mobile-only endpoint that exists in repository backend code but is not available on the currently deployed API used by the development APK.

Fix applied:

- Mobile now calls the same `/auth/login` endpoint used by the web client.
- API requests now use credentialed requests for the server-managed auth cookie.
- Login verifies the resulting session through `/auth/me` before navigating into the authenticated app.
- Launch bootstrap restores sessions through `/auth/me` instead of gating on a SecureStore token.

Automated/runtime device validation is not available from the GitHub connector environment. User phone testing remains the acceptance gate.

## Architecture Decisions

- GitHub `main` is the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- The app uses Expo Router file-based navigation.
- Mobile authentication now deliberately reuses the web auth endpoints and server-managed HTTP-only session cookie.
- `/auth/mobile/login` is no longer used by the mobile client.
- No social-auth UI is shipped until matching backend providers and account-linking behavior exist.
- Reference boards guide composition, spacing, hierarchy, color, and interaction, but unsupported product features are not fabricated.

## Last Commit

Pending authentication-fix commit for user retest.
