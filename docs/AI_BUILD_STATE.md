# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The repaired API deployment is working.

Accepted product work also includes the 19 reference-board screens, shared web/mobile auth, My Prayers, Prayer Wall, Saved Prayers, Journal, notifications, device-local reminders, account management, Support + Donation implementation, keyboard/safe-area repairs, and the selected `PIV-logo.png` branding asset.

## Current Implementation

### Intro visual replication

The current visual target is the four ideal images generated and approved in chat: Splash, Turn Scripture Into Prayer, Pray Through Every Verse, and Pray Together.

- **Splash**
  - `mobile/src/app/index.tsx` now uses the generated ideal sunrise/mountain Splash render as its full-screen visual layer.
  - The visual therefore preserves the approved composition: Pray in Verses branding, blue-to-gold sunrise, mountain depth, “Pray Scripture. Live Scripture.” and the bottom “A CLOSER WALK / A BRIGHTER TOMORROW” treatment.
  - A short fade plus very subtle zoom remains on launch.
  - Existing `/auth/me` session restoration and routing to the signed-in app or onboarding are unchanged.

- **Onboarding 1 — Turn Scripture Into Prayer**
  - Rebuilt to match the approved ideal: centered PIV branding, large navy serif heading, muted two-line support copy, tilted Philippians Scripture card, soft blue organic backdrop, large bent gold Scripture-to-Prayer connector, highlighted Prayer card, pale botanical accents, first active progress dot, and rounded royal-blue Next action.

- **Onboarding 2 — Pray Through Every Verse**
  - Rebuilt to match the approved ideal: centered PIV branding, large navy serif heading, structured Book → Chapter → Verse → Prayer cards, pale-blue icon wells, gold vertical connectors, highlighted warm Prayer state, second active progress dot, and wide royal-blue Next action.

- **Onboarding 3 — Pray Together**
  - Rebuilt to match the approved ideal: large navy title, muted Prayer Wall copy, two floating community request cards, pale globe/network treatment, avatar nodes, restrained gold arc, third active progress dot, and wide Get Started action.

- Skip, Next, Get Started, page state, page-change fade, Login routing, and authentication behavior remain functional and unchanged.
- The gray floating gear visible in development screenshots remains an Expo Dev Client overlay and is not app UI.

### Existing signed-in polish retained

- My Prayers uses one floating Add action when the list contains prayers.
- My Prayer editor bottom actions respect Android safe-area navigation.
- Prayer Detail uses the exact web detail photograph and safe-area-aware Save/Journal actions.
- Home uses the web prayer-group hero image and lowered greeting/name copy.
- Donation presets format NGN values deterministically and the donation screen respects safe areas.
- App/native icon configuration points to `PIV-logo.png`; a fresh APK is required to see launcher-icon changes.

No backend, API contract, auth behavior, database schema, dependency, or payment contract changed in this intro visual cycle.

## Testing Status

Android device review required:

1. Splash should visually match the approved ideal sunrise reference and still route correctly after session restoration.
2. Onboarding 1 should match the approved Scripture → Prayer composition, especially the curved gold connector and overlapping cards.
3. Onboarding 2 should show the four-step Book → Chapter → Verse → Prayer stack with the final Prayer card highlighted.
4. Onboarding 3 should show the two Prayer Wall cards over the globe/community network treatment.
5. Skip must go to Login; Next must move 1 → 2 → 3; Get Started must go to Login.
6. All four intro screens must fit the user's Android viewport without clipped CTA controls or text.

## Known Issues / Release Notes

- Different phone aspect ratios can slightly change native spacing; the target Android device remains the visual acceptance reference.
- The first native cold-start frame still comes from Expo splash configuration; the JavaScript Splash implementation is the approved full visual Splash and can be reviewed immediately through Metro.
- The gray floating gear belongs to Expo Dev Client, not Pray in Verses.
- Donation confirmation depends on Paystack webhook state and may remain Pending briefly after return.
- Server notifications are an in-app inbox only; remote push-token delivery is not yet implemented.
- Prayer reminders remain device-local.
- Verified Android App Links for password-reset emails remain part of Android release polish.

## Next Tasks

After these four intro screens are accepted:

1. Continue signed-in screen visual polish screen by screen.
2. Complete remaining About/Mission/Legal native screens and navigation.
3. Finish Android release polish, App Links, launcher/splash checks and Play Store readiness.
4. Begin iOS release work after Android acceptance.

## Architecture Decisions

- GitHub `main` remains the source of truth.
- Expo SDK 57 versioned documentation is authoritative.
- The approved generated visuals are the visual specification for the current Splash/onboarding polish.
- Session/auth/navigation behavior must remain native and functional even when visual treatment is heavily polished.
- Brand-logo placement uses the actual `PIV-logo.png` asset on native onboarding layouts.

## Last Commit

Current visual target: pixel-close replication of the approved ideal Splash and three onboarding references. Status remains AWAITING USER TEST.
