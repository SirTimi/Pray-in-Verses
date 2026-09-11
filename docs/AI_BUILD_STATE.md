# AI Build State

## Current Goal

Rework the Pray in Verses mobile application to match the approved four-screen reference boards, one testable vertical slice at a time.

## Current Status

AWAITING USER TEST

## Last Accepted Task

None recorded under the new repository-driven acceptance workflow. The existing `main` branch already contains the mobile authentication API/service foundation and the earlier signup, forgot-password, and reset-password implementation.

## Current Implementation

The current development increment reworks reference Screens 1–5:

- Branded launch screen with session bootstrap and secure-token session restoration.
- Three-step onboarding flow inspired by the approved reference: Scripture to Prayer, verse-by-verse prayer flow, and Prayer Wall/community.
- Functional Sign In screen matching the new visual direction.
- Sign In remains connected to the existing `/api/auth/mobile/login` backend and stores the JWT through the existing SecureStore API layer.
- Returning users with a valid stored token are routed directly to the authenticated app placeholder.
- Social sign-in controls shown in the reference were intentionally not implemented because the repository has no social-auth backend contract.

## Completed

- Mobile backend authentication support exists on `main`.
- Mobile API client and SecureStore token persistence exist on `main`.
- Signup, forgot-password, and reset-password flows exist on `main`.
- Reference Screen 1 launch experience implemented.
- Reference Screens 2–4 onboarding experience implemented.
- Reference Screen 5 sign-in experience implemented and connected to the backend.

## Next Tasks

After user acceptance of this increment:

1. Rework reference Screens 6–10: Home, Bible Books, Chapter Selection, Verse Selection, and Search.
2. Rework reference Screens 11–14: Prayer Detail, Prayer Wall, Request Detail, and Create Request.
3. Rework reference Screens 15–19: Saved Prayers, Journal, Journal Entry, Profile/Settings, and reusable app states.
4. Bring remaining auth screens (Signup, Forgot Password, Reset Password) into the same visual system where needed.

## Known Issues

- Home is still the existing authenticated placeholder and is intentionally outside this increment.
- Signup, forgot-password, and reset-password retain their previous styling until a later focused redesign increment.
- The repository currently declares `lucide-react-native` without the required direct `react-native-svg` peer dependency; local Expo Doctor previously identified this. This increment does not alter dependencies, so a clean environment should run `npx expo install react-native-svg` until that dependency change is committed in a dedicated native/build increment.
- Native launch-screen appearance can differ from the in-app branded launch screen in Expo development builds; Expo SDK 57 documents that standalone/release builds are the authoritative splash-screen check.

## Testing Status

Automated/runtime device validation is not available from the GitHub connector environment. The changed TypeScript/TSX files were syntax-reviewed before commit. User device testing is the acceptance gate.

## Architecture Decisions

- GitHub `main` is the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile implementation decisions.
- The app uses Expo Router file-based navigation.
- Native auth uses the existing backend JWT via Bearer token and Expo SecureStore.
- No social-auth UI is shipped until matching backend providers and account-linking behavior exist.
- Reference boards guide composition, spacing, hierarchy, color, and interaction, but unsupported product features are not fabricated.

## Last Commit

Current development increment: `feat(mobile): rework onboarding and sign-in experience` (commit hash is reported in the handoff after creation).
