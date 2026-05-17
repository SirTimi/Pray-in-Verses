# Security Protocols — Pray-in-Verses

This document defines the security protocols, controls, and standards that must be applied to the Pray-in-Verses platform. Recommendations are derived from a review of the current codebase (NestJS API, React/Vite frontend, PostgreSQL via Prisma, deployed to GCP Cloud Run).

The document is organized by layer. Each section states the protocol to adopt, why it matters in this context, and the concrete change required.

---

## 1. Threat model (one-page summary)

**Assets**
- User accounts (email + bcrypt hash + role).
- Spiritual/personal content: prayer journals, prayer requests, prayer points, comments.
- Donation records (Paystack references, amounts in kobo, payer email, IP/UA).
- Admin/editor capabilities: invites, role assignment, suspension, broadcast notifications, curated prayer publishing.

**Primary actors**
- Anonymous web visitor, authenticated user, moderator, editor, super admin, Paystack (webhook), opportunistic external attacker, compromised account, malicious moderator/editor.

**Top risks to defend against**
1. Credential stuffing / brute-force on `/api/auth/login` and `/api/auth/forgot-password`.
2. Privilege escalation through the admin module (role updates, invite acceptance).
3. Payment-flow tampering (forged Paystack webhooks, replayed references, amount manipulation).
4. Stored XSS via user-generated content (displayName, prayer requests, comments, journals).
5. Token theft and session fixation.
6. PII / spiritual content disclosure through broken access control on user-scoped endpoints.
7. Supply-chain compromise of npm dependencies.
8. Secret leakage at build time or in logs.

---

## 2. Transport & network protocols

| Protocol | Requirement |
|----------|-------------|
| **TLS** | TLS 1.2 minimum, TLS 1.3 preferred. Terminate at Cloud Run / managed ingress. Disable TLS 1.0/1.1 and weak ciphers (RC4, 3DES, CBC-only suites). |
| **HSTS** | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Submit `prayinverses.com` to the HSTS preload list once stable. |
| **Certificates** | Managed certificates via Google-managed SSL on Cloud Run. Rotate automatically. Monitor expiry via Cloud Monitoring uptime checks. |
| **DNS** | Enable DNSSEC on the `prayinverses.com` zone. Add CAA records restricting issuance to Google. |
| **Email** | Configure SPF, DKIM, and DMARC (`p=reject` after a monitoring period) on the sending domain used by SMTP / SendGrid. |

---

## 3. HTTP security headers

`nginx.conf` currently sets no security headers. Add the following on the frontend container, and mirror via NestJS `helmet()` on the API.

```
add_header Strict-Transport-Security  "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options     "nosniff" always;
add_header X-Frame-Options            "DENY" always;
add_header Referrer-Policy            "strict-origin-when-cross-origin" always;
add_header Permissions-Policy         "geolocation=(), camera=(), microphone=(), payment=(self)" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-site" always;
add_header Content-Security-Policy    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.prayinverses.com https://api.paystack.co; frame-src https://checkout.paystack.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
```

Adopt **`helmet`** on the NestJS app (`app.use(helmet())`) with `crossOriginResourcePolicy` and `contentSecurityPolicy` aligned to the frontend policy. Remove the `X-Powered-By` header (`app.disable('x-powered-by')` on the underlying Express instance).

---

## 4. Authentication protocols

The current implementation (JWT in httpOnly cookie + bcrypt) is a good baseline. Tighten it as follows.

1. **Password policy.** Enforce on signup and reset: minimum 12 characters, screened against the Pwned Passwords k-anonymity API (`api.pwnedpasswords.com/range/{prefix}`). Reject if hash count > 0.
2. **bcrypt cost.** Keep work factor at 12 (current). Re-hash on next successful login if the stored hash uses a lower factor (forward-compat).
3. **JWT signing.** Use **`HS256` with a 256-bit secret** stored in Secret Manager, **or** migrate to **`RS256`/`EdDSA`** with a key pair so the public key can be distributed to other services without sharing signing capability. Rotate signing keys quarterly with overlapping `kid`s.
4. **Token lifetime.** Reduce access token TTL from 7 days to **15 minutes**, and issue a **refresh token** (opaque, server-side stored, hashed at rest, rotated on use, revocable). Persist a `Session` table keyed by hashed refresh token, IP, UA, issuedAt, lastUsedAt, revokedAt.
5. **Cookie flags.** Current flags (`httpOnly`, `Secure`, `SameSite=lax`, domain `.prayinverses.com`) are correct. For the admin surface, consider `SameSite=strict` on a separate admin cookie.
6. **Logout.** On logout, revoke the refresh token server-side in addition to clearing cookies. Provide "log out of all sessions" in account settings.
7. **MFA.** Add TOTP (RFC 6238) for all `SUPER_ADMIN`, `EDITOR`, and `MODERATOR` accounts. WebAuthn/passkeys as a follow-up.
8. **Password reset.** Existing 60-minute hashed-token TTL is correct. Add: single-use enforcement, invalidate all other active sessions on successful reset, and rate-limit per email + IP.
9. **Account enumeration.** `/api/auth/login` must return a generic `Invalid credentials` message and a uniform response time regardless of whether the email exists. `/api/auth/forgot-password` already returns generically — keep it.
10. **Invite tokens.** Hash invite tokens at rest (same SHA-256 pattern as password reset), set a 72-hour TTL, single-use, scoped to the inviting admin.

---

## 5. Authorization protocols

1. **Deny by default.** Every controller method must explicitly declare its auth requirements. Add a CI lint (custom ESLint rule or unit test) that fails the build if a controller method has neither `@Public()` nor a guard chain.
2. **RBAC.** Keep `JwtCookieAuthGuard` + `RolesGuard`. Document the role matrix (which role can perform which action) in `api/docs/roles.md` and assert it with integration tests.
3. **Ownership checks.** For user-scoped resources (`journals`, `saved-prayers`, `my-prayers`, `prayer-wall` edits, bookmarks), the service must verify `resource.userId === req.user.sub` *before* read/write. Today this is enforced inconsistently — centralize via an `@OwnedBy('userId')` decorator or service helper, and cover with tests for cross-user IDOR.
4. **Admin actions are audited.** See §11.

---

## 6. Input validation, output encoding & content safety

1. **Validation pipe** is globally enabled with `whitelist: true, transform: true`. Add `forbidNonWhitelisted: true` to reject unknown fields and `transformOptions: { enableImplicitConversion: false }` to avoid surprising coercions.
2. **DTOs everywhere.** Every request body, query, and route param must have a DTO with explicit `class-validator` decorators. Free-text fields (prayer request body, comment, journal entry) must have a hard `@MaxLength` (e.g. 5000) to bound DB and rendering cost.
3. **Output encoding.** React auto-escapes JSX, and the codebase does not use `dangerouslySetInnerHTML` — preserve this invariant via an ESLint rule (`react/no-danger`).
4. **HTML in user content.** If rich text is ever introduced for prayer requests or journals, sanitize server-side with DOMPurify (jsdom) before persisting, using an allowlist of tags and stripping `style`, `on*`, and `javascript:` URLs.
5. **Markdown / link handling.** If links are rendered, force `rel="noopener noreferrer nofollow ugc"` and `target="_blank"`, and strip non-http(s) schemes.
6. **File uploads.** None today. If added, accept via signed GCS URLs, restrict MIME type and size at the bucket level, scan with Cloud Storage virus scanning, and serve from a cookie-less subdomain.

---

## 7. API & abuse-prevention protocols

1. **Rate limiting.** Add `@nestjs/throttler` with tiers:
   - `/api/auth/login`: 5/min/IP, 20/hour/email.
   - `/api/auth/signup`: 3/hour/IP.
   - `/api/auth/forgot-password`: 3/hour/email, 10/hour/IP.
   - `/api/auth/reset-password`: 5/hour/IP.
   - Authenticated write endpoints: 60/min/user.
   - Default fallback: 120/min/IP.
2. **Bot mitigation.** Put hCaptcha or Cloudflare Turnstile in front of signup, login (after 3 failures), forgot-password, and donation initialization.
3. **Body size.** Current 1 MB JSON limit is appropriate. Keep the raw Paystack webhook route exempt only for signature verification.
4. **CORS.** Continue driving from `CORS_ORIGINS`. Pin to the exact origins in production; never use `*` with credentials. Reject preflights from unknown origins (NestJS does this by default).
5. **CSRF.** SameSite=lax + cookie auth covers most cases. For state-changing endpoints invoked from cross-origin contexts (none today), add a double-submit CSRF token. Audit again if a mobile webview or extension client is added.
6. **Idempotency.** Donations initialization and Paystack webhook handler must be idempotent on the Paystack `reference`. Enforce a unique constraint on `Donation.reference` (verify it exists) and treat duplicate webhook deliveries as no-ops.

---

## 8. Payment protocol (Paystack)

1. **Webhook signature.** Verify `x-paystack-signature` as HMAC-SHA512 over the raw request body using `PAYSTACK_SECRET_KEY`. Compare in constant time. Reject otherwise. The raw-body wiring in `main.ts` is correct; keep that route excluded from JSON middleware.
2. **Amount integrity.** Never trust client-supplied amounts at verification time. Re-fetch the transaction from Paystack on webhook receipt and reconcile `amount`, `currency`, `status`, and `reference` before marking the `Donation` row `success`.
3. **PCI scope.** Do not handle or log PAN, CVV, or full card data. Confirm Paystack Inline / Checkout is used so card data never touches our servers. Mask references in logs to first 4 / last 4.
4. **Refund / dispute path.** Document an internal runbook; do not auto-process refunds based on webhook content alone — require an admin action.

---

## 9. Data protection protocols

1. **Encryption in transit.** Enforced via §2.
2. **Encryption at rest.** Cloud SQL / managed Postgres provides disk encryption by default. Confirm CMEK (customer-managed keys via Cloud KMS) for production.
3. **Field-level encryption.** Consider AES-256-GCM application-level encryption (via KMS-wrapped DEK) for:
   - `Donation.metadata` (contains IP / UA).
   - Prayer journal `body` (treat as private spiritual content).
4. **Backups.** Daily automated Cloud SQL backups, 30-day retention, point-in-time recovery enabled. Quarterly restore drill, documented in a runbook.
5. **Data minimization.** Stop persisting full UA strings indefinitely; truncate to browser family + major version after 30 days. Hash IPs (HMAC with a rotating pepper) if the IP is only needed for fraud signals.
6. **Deletion / GDPR-style requests.** Implement an account deletion endpoint that (a) anonymizes prayer requests and comments rather than hard-deleting (to preserve thread integrity), (b) hard-deletes journal entries, saved prayers, prayer points, password resets, sessions, (c) retains donations (legal/tax) with PII stripped.
7. **Data classification.** Tag fields as `public | internal | confidential | restricted` in `schema.prisma` comments; restricted fields (passwordHash, refresh tokens, reset tokens, Paystack metadata) must never appear in API responses, logs, or analytics.

---

## 10. Secret management protocols

1. **Source of truth.** All secrets live in **Google Secret Manager**, mounted into Cloud Run as environment variables at deploy time. No secret value in `cloudbuild.yaml`, repo, or container image.
2. **`.env.example` hygiene.** The current example contains plaintext SMTP and DB passwords (`Admin123!`, `GodisGreat@2006`). Replace with placeholders (`<set-in-secret-manager>`) and rotate any value that has ever been real. JWT secret placeholder must be changed before any deploy.
3. **Rotation cadence.**
   - `JWT_SECRET` / signing keys: quarterly, with overlapping `kid`.
   - Database password: every 90 days, via Cloud SQL IAM auth where possible.
   - `PAYSTACK_SECRET_KEY`: on personnel change or suspected compromise.
   - SMTP / SendGrid API key: every 90 days.
4. **Access control.** Secret Manager IAM restricted to the Cloud Run runtime service account and named break-glass admins. Audit log all `secretmanager.versions.access` events.
5. **Secret scanning in CI.** Enable GitHub secret scanning + push protection on the repo, and add a `gitleaks` step in CI for defense in depth.

---

## 11. Logging, monitoring, and audit protocols

1. **Structured logging.** Replace ad-hoc `console.log` with a structured logger (pino or the NestJS Logger with a JSON transport). Every log line carries: `requestId`, `userId` (if authenticated), `ip`, `route`, `status`, `latencyMs`. Never log: passwords, password hashes, JWTs, refresh tokens, reset tokens, full Paystack reference (mask), card data.
2. **Request IDs.** Generate at edge (`X-Request-Id`), accept upstream if present, propagate to logs.
3. **Audit log.** Add an `AuditEvent` table capturing: actor `userId`, action (`USER_ROLE_CHANGED`, `USER_SUSPENDED`, `INVITE_CREATED`, `INVITE_ACCEPTED`, `CURATED_PRAYER_PUBLISHED`, `BROADCAST_SENT`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `PASSWORD_RESET`, `MFA_ENROLLED`, `MFA_DISABLED`), targetType, targetId, IP, UA, timestamp, before/after JSON for state changes. Retain ≥ 1 year. Surface in an admin UI.
4. **Centralized aggregation.** Ship logs to Cloud Logging (default for Cloud Run) and create log-based metrics for: 5xx rate, login failures per minute, webhook signature failures, role changes per day.
5. **Alerting.** Cloud Monitoring alerts on:
   - Login failure spike (> 50/min global).
   - 5xx rate > 1% over 5 min.
   - Paystack webhook signature failures > 5/hour.
   - Any `SUPER_ADMIN` role grant.
   - Secret access from outside expected service accounts.
6. **Error tracking.** Wire Sentry (or Google Error Reporting) on both API and frontend. Scrub PII via `beforeSend`.

---

## 12. Supply-chain & SDLC protocols

1. **Dependency scanning.** Enable Dependabot (or Renovate) on both `package.json` files, with weekly PRs and immediate security PRs. Add `npm audit --omit=dev --audit-level=high` to CI as a blocking step.
2. **Lockfile discipline.** Use `npm ci` (not `npm install`) in Docker builds. The frontend Dockerfile already does; the API Dockerfile uses `npm install --include=dev` — switch to `npm ci` and split into a builder stage that drops dev deps from the runtime image.
3. **SBOM.** Generate a CycloneDX SBOM in CI (`@cyclonedx/cyclonedx-npm`) and store as a build artifact.
4. **Image scanning.** Enable Artifact Registry / Container Analysis vulnerability scanning on the GCR repos. Fail deploys on `HIGH`/`CRITICAL` CVEs unless explicitly waived.
5. **Branch protection.** Require PR review, passing CI (lint, typecheck, tests, audit, image scan), signed commits, and linear history on `main`. Disallow force-push.
6. **Code review.** All changes to `api/src/modules/auth`, `api/src/modules/admin`, `api/src/modules/donations`, and `nginx.conf` require a second reviewer.
7. **Static analysis.** Add `eslint-plugin-security`, `eslint-plugin-no-unsanitized`, and (optional) GitHub CodeQL on push to `main`.

---

## 13. Container & runtime protocols

1. **Multi-stage builds.** Convert `api/Dockerfile` to a two-stage build: builder installs dev deps and runs `npm run build`; runtime stage runs `npm ci --omit=dev` and copies only `dist/`, `prisma/`, and `node_modules/`.
2. **Non-root user.** Add `USER node` (or a dedicated UID) in both Dockerfiles. Set `WORKDIR` ownership accordingly.
3. **Read-only filesystem.** Run Cloud Run containers with `--no-allow-unauthenticated` for non-public services, and with read-only root filesystem where possible.
4. **Minimal base.** `node:20-alpine` is acceptable; pin by SHA digest (`node:20-alpine@sha256:...`) to defend against tag mutation.
5. **Healthchecks.** Add `/health` (liveness) and `/ready` (DB connectivity) endpoints; wire to Cloud Run probes.
6. **Resource limits.** Set Cloud Run CPU/memory caps and max concurrency to bound blast radius and runaway cost.

---

## 14. Operational protocols

1. **Incident response.** Document a runbook: detection → triage → containment (revoke keys, rotate JWT secret, invalidate sessions, disable affected accounts) → eradication → recovery → post-mortem. Define RTO 4h, RPO 1h.
2. **Vulnerability disclosure.** Publish `SECURITY.md` and `security.txt` (`/.well-known/security.txt`) with a reporting address (`security@prayinverses.com`) and PGP key.
3. **Penetration test.** Annual third-party pentest covering auth, admin, payments, and prayer wall. Remediate `HIGH`+ within 30 days.
4. **Access review.** Quarterly review of `SUPER_ADMIN`, `EDITOR`, and `MODERATOR` accounts; revoke unused privileges. Mandatory MFA enforced before review passes.
5. **Backups & DR.** Quarterly restore drill from Cloud SQL backups into a staging project; verify integrity and time-to-restore.
6. **Privacy.** Maintain a public privacy policy describing data collected (email, displayName, prayer content, donation metadata), retention, and processors (Paystack, SendGrid/SMTP, GCP). Provide an in-app data export.

---

## 15. Standards & references

- OWASP ASVS 4.0.3 — target Level 2 across the application.
- OWASP API Security Top 10 (2023).
- NIST SP 800-63B — authenticator and lifecycle requirements.
- CIS Docker Benchmark v1.6 — container hardening.
- PCI DSS v4.0 SAQ-A — Paystack-hosted checkout scope.
- GDPR Art. 5, 25, 32 — data protection by design and by default.

---

## 16. Prioritized rollout

**P0 (within 2 weeks)**
- Add Helmet + nginx security headers and CSP.
- Add `@nestjs/throttler` rate limits on all `/api/auth/*` routes.
- Rotate every credential ever placed in `.env.example`; replace example values with placeholders.
- Add Paystack webhook HMAC verification test coverage and reconcile-by-fetch on success.
- Enable Dependabot, secret scanning, push protection, and branch protection.
- Convert API Dockerfile to multi-stage, drop dev deps from runtime, run as non-root.

**P1 (within 6 weeks)**
- Short-lived access tokens + refresh-token rotation with server-side session table.
- TOTP MFA for admin/editor/moderator roles.
- Audit log table and admin UI; alerts on `SUPER_ADMIN` grants.
- Sentry on API and frontend.
- IDOR test coverage on every user-scoped endpoint.

**P2 (within 12 weeks)**
- Field-level encryption for journal bodies and donation metadata; CMEK on Cloud SQL.
- WebAuthn/passkeys.
- Pentest + ASVS L2 gap closure.
- Account deletion / data export endpoints.

---

*Owner: Security working group. Review cadence: quarterly, or on any P0 incident.*
