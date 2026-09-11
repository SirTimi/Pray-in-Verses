# AI Build State

## Current Goal

Complete the Pray in Verses mobile application in focused, testable slices while keeping GitHub `main` as the source of truth.

## Current Status

AWAITING USER TEST

## Last Accepted Task

The Account-management and Cloud Run deployment-repair cycle was accepted by the user on 2026-09-11. The user confirmed the repaired API deployment works.

Accepted behavior includes:

- All 19 numbered reference-board screens.
- Shared web/mobile authentication using `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`.
- Sign In, Sign Up, Forgot Password, and Reset Password using one coherent mobile visual system.
- Real curated-prayer, Saved Prayers, Journal, Prayer Wall, My Prayers, identity, notifications, reminders, and account-management flows.
- Persisted display-name updates and authenticated password changes.
- Cloud Run API startup on the aligned NestJS 11.2.3 runtime.

## Current Implementation

The app is now in visual-polish work while the completed Support + Donation flow still awaits final end-to-end payment acceptance.

### Support + Donation already implemented

- Native Help & Support screen using `info@prayinverses.com`.
- Profile and Home both expose Support the Mission.
- Real Paystack initialization, browser handoff, server-authoritative donation status, persisted pending references, and success/failed/pending states.
- Public non-PII `GET /api/donations/:reference/status`.
- Web `/donations/thank-you` callback page.

### Mobile UX repairs already implemented

- Bottom tabs respect the runtime bottom safe-area inset.
- Bottom tabs hide while the software keyboard is open.
- Root Android keyboard avoidance shrinks the usable viewport above the keyboard.
- My Prayers no longer shows duplicate Add Prayer controls: the empty-state CTA is used when the list is empty, and the header `+` is used once prayers exist.

### Current polish slice: Splash + Login + Onboarding

- The previous Splash/Login polish replaced the template-looking mobile icon with the Pray in Verses brand asset already used by the web Login and added a short native/JavaScript splash transition.
- The user then supplied Android screenshots of the three onboarding pages and requested a more professional frontend/UI treatment.
- `mobile/src/app/(auth)/welcome.tsx` has been visually rebuilt without changing onboarding navigation behavior.
- The onboarding canvas now uses the app's warm cream, deep navy, pale brand blue, restrained gold, rounded surfaces, and subtle depth instead of a mostly-flat white layout.
- Each page now has a stronger hierarchy: compact step indicator, contextual eyebrow, larger serif title, clearer support copy, framed visual showcase, segmented progress, primary CTA, and a small supporting hint.
- Page 1 now presents Scripture-to-prayer as a polished transformation flow with Scripture and prayer cards, meaningful Lucide icons, and a restrained gold connector.
- Page 2 now presents Book → Chapter → Verse → Prayer as a structured four-step flow with numbered cards, real icons, connectors, and a highlighted final prayer state.
- Page 3 now presents the Prayer Wall inside a framed community scene with stronger request cards, real heart/comment icons, subtle globe rings, and a community-support message.
- The old text/Unicode illustration glyphs were replaced with `lucide-react-native` icons already present in the mobile dependency set.
- A short page-change fade/translate animation was added, and a compact layout path is used on shorter Android screens to reduce clipping risk.
- Skip, Continue, Get Started, and Login routing behavior remain unchanged.
- The user requested a newly uploaded logo called “pray the bible logo”. No matching standalone logo file is currently present in GitHub `main`, the current conversation attachments, or the searched File Library results, so the logo has intentionally not been guessed or substituted. The exact asset must be supplied or committed before Splash/Login can be switched to it.

## Completed

- Shared web/mobile authentication accepted on Android.
- Expo dev client, react-native-svg, and EAS profiles configured.
- All 19 numbered reference-board screens accepted.
- Authentication functional polish accepted.
- My Prayers accepted.
- Notifications and Prayer Reminders accepted, including Android notification sound repair.
- Account backend/mobile Account screen accepted.
- Duplicate mobile-only login endpoint removed.
- Cloud Run startup repaired: Debian/OpenSSL runtime, runtime-safe Nest imports, non-blocking mail verification, and aligned Nest runtime packages.
- Support + Donation implementation completed and awaiting final payment-flow acceptance.
- Android bottom-safe-area, keyboard avoidance, and My Prayers CTA de-duplication implemented.
- Splash + Login visual polish implemented and awaiting device acceptance.
- Three-screen onboarding visual polish implemented and awaiting device acceptance.

## Next Tasks

After the current visual polish and Support + Donation payment flow are accepted:

1. Wire the exact user-supplied “pray the bible logo” into Splash/Login once the actual asset is available.
2. Continue visual polish screen by screen through authentication and the main app experience.
3. Complete remaining About/Mission/Legal native screens and navigation.
4. Finish Android release polish, verified password-reset App Links, release build checks, and Play Store readiness.
5. Begin iOS build/release work after Android acceptance.

## Known Issues / Release Notes

- `api/package-lock.json` still records mixed NestJS patch versions. The production Docker image normalizes `@nestjs/common`, `@nestjs/core`, and `@nestjs/platform-express` to exact 11.2.3 and asserts them during build; the lockfile should be regenerated as repository hygiene.
- Donation confirmation depends on Paystack webhook state and can briefly remain Pending after the donor returns.
- Server notifications are an authenticated in-app inbox only; backend remote push-token registration/delivery does not yet exist.
- Prayer reminders are device-local and do not sync across devices or web.
- Verified Android App Links for password-reset emails remain part of Android release polish.
- Email editing remains intentionally unavailable until a verified email-change flow exists.
- The native splash asset/configuration changed in the earlier Splash/Login polish, so a new development/release APK is required to judge the true cold-start native splash. Metro alone is sufficient to review the JavaScript launch animation, Login screen, and the current onboarding redesign.
- The gray floating gear visible in the user's onboarding screenshots is the Expo development-client overlay, not Pray in Verses application UI.

## Testing Status

Current visual-polish cycle requires Android device review:

- All three onboarding pages should fit the device viewport cleanly without clipped illustration cards, headings, progress, or CTA controls.
- Page transitions should fade/slide subtly rather than jump visually.
- The stronger cream/navy/blue/gold hierarchy and larger framed illustrations should feel less sparse than the previous screenshots.
- Continue should advance through pages 1 → 2 → 3, the progress indicator should follow the active page, Skip should still go to Login, and Get Started should still go to Login.
- No onboarding route or authentication behavior should change.
- Existing Splash/Login behavior from the previous polish should remain intact until the requested replacement logo asset is actually available.
- A fresh APK is still required only for judging the native cold-start splash configuration; this onboarding UI change is JavaScript/TypeScript only and can be reviewed after restarting Metro with a clear cache.

## Architecture Decisions

- GitHub `main` remains the source of truth and active integration branch.
- Expo SDK 57 versioned documentation is authoritative for mobile behavior.
- Web and native clients share one canonical API and session contract.
- Brand artwork must come from an actual repository/uploaded asset; a requested logo is not inferred from a similar filename or recreated from memory.
- Native splash configuration and JavaScript launch animation are separate layers: native splash handles cold-start presentation; the JS launch screen handles session restoration and the subtle branded animation.
- Onboarding illustration UI should be built from native layout primitives and existing icon dependencies so it remains responsive, crisp, and theme-consistent across Android sizes.
- Animation should remain short, calm, and functional rather than becoming a long intro.
- App icon/favicon work remains separate from in-app logo presentation unless explicitly included in release polish.

## Last Commit

Current onboarding polish: `polish(mobile): elevate onboarding visuals`.
Previous Splash/Login polish: `polish(mobile): refine splash and login branding`.
