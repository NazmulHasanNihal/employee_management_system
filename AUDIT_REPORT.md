# Website / Application Audit Report — Employee Management System (EMS)

**Project:** `employee_management_system` (Next.js 15 + Prisma + Supabase)
**Audit date:** 2026-07-20
**Scope:** Security, Performance & Code Quality, UX / Accessibility, Documentation, Deployment & CI/CD, Internationalization, Observability
**Method:** Read-only source inspection + static analysis + local test/lint/type runs. No code modified.

---

## 1. Executive Summary — Overall Rating

| Category | Rating | Score |
|---|---|---|
| **Overall** | **B+ (Good, with critical caveats)** | **76 / 100** |
| Security | Adequate (1 critical gap) | 70 / 100 |
| Performance & Code Quality | Adequate (1 correctness bug, missing indexes) | 72 / 100 |
| UX & Accessibility | Adequate (strong basics) | 78 / 100 |
| Documentation | Adequate (broken internal ref) | 70 / 100 |
| Deployment & CI/CD | Weak (no deploy step) | 55 / 100 |
| Internationalization | Strong | 88 / 100 |
| Error Handling & Observability | Strong | 85 / 100 |

**Grade legend:** Strong (85–100) · Adequate (65–84) · Weak (45–64) · Critical gap (<45)

### Headline verdict
This is a **mature, well-architected codebase** with genuinely strong i18n (EN/BN), observability (Sentry + PostHog + structured logging), accessibility basics (shadcn/ui + axe tests), and a real, working N+1 fix in the team-performance path. It is **not production-ready for multi-tenant use** and has **two issues that warrant immediate attention** before any high-stakes deployment:

1. **CRITICAL — Tenancy isolation is not enforced in the primary data path.** `src/app/actions/db.ts` (the bulk of the UI's API) applies **zero tenant filtering**, and `tenantId` is never assigned during provisioning, so tenant scoping is a silent no-op. In any multi-tenant deployment, cross-tenant data leakage is possible. (Single-tenant use is unaffected, but the architecture is split across two divergent query layers.)
2. **HIGH — Live secrets sit in the working-tree `.env`** (Supabase service-role key, DB password, VAPID key, Sentry/PostHog tokens). The service-role key is also reused to derive the NID field-encryption key — poor key hygiene and a rotation hazard. (Good news: `.env` is correctly gitignored, so it is not committed.)

---

## 2. Detailed Findings & Ratings

### 2.1 Security — Rating: ADEQUATE (70/100)

| Sub-area | Verdict | Evidence |
|---|---|---|
| AuthN / AuthZ | Adequate | `src/lib/auth.ts` derives privileges from authoritative DB flags (not self-editable `designation`); `middleware.ts` + `(protected)/layout.tsx` guard routes; mutations strip privileged fields. Gaps: `notifications.markRead`/`savePushSub` (`db.ts:1460-1473`) don't verify row ownership; hardcoded owner-email fallback (`auth.ts:33`). |
| Input validation / injection | Adequate | Centralized Zod validation (`validation.ts`); no raw SQL (`$queryRaw` absent); no `dangerouslySetInnerHTML`; strong file upload (extension allowlist + magic bytes + signed URLs, `upload.ts:10-95`). |
| CSRF / origin | Weak | Commit `5f8f727` overstates "CSRF protection." `middleware.ts:55-84` is origin-based only and **allows requests with no `Origin`/`Referer`** (`middleware.ts:72-75`); no token/double-submit cookie. |
| Secrets management | Weak | Live secrets in working `.env` (`.env:4-27`); service-role key reused as NID AES key (`nid.ts:23-35`). Not git-leaked (good). |
| Dependencies | Adequate | `pnpm-lock.yaml` present → run `pnpm audit`. Suspicious `lucide-react ^1.23.0` (`package.json:36`) — verify resolved version; unused `handlebars` dep. |
| Data protection | Adequate | NID AES-256-GCM (`nid.ts`); HSTS + preload (`next.config.ts:77-79`); rate-limit only on provisioning (`ratelimit.ts`); `registry.getAll` exposes all PII to any authed user (`db.ts:299-301`); **no rate limiting on login/reset/invite**. |
| Tenancy isolation | **CRITICAL GAP** | `tenantId` never assigned; `db.ts` (main path) has zero tenant filtering; `queries.ts` scoping is a no-op when `tenantId` is null (`queries.ts:1489-1513`). |

**Top security priorities:** enforce tenant scoping in `db.ts` (or unify query layers) before multi-tenant use; rotate/secure `.env` secrets and stop reusing the service-role key for encryption; add token-based CSRF; scope `registry.getAll` PII and rate-limit auth endpoints; run `pnpm audit`.

---

### 2.2 Performance & Code Quality — Rating: ADEQUATE (72/100)

| Sub-area | Verdict | Evidence |
|---|---|---|
| N+1 fixes (perf commit) | Adequate | `getTeamPerformance` (`queries.ts:465-528`) and dashboard 12-month trend (`queries.ts:211-244`) genuinely rewritten to bulk queries + `unstable_cache`. Real, correct improvement. |
| **Correctness bug** | **Critical** | Dashboard payroll trend filters by `createdAt` (insertion time) instead of payroll period (`queries.ts:222-229`) → trend `payroll` series is silently wrong. |
| Remaining N+1 | Weak | `getChainOfCommand` (`queries.ts:417-424`) loops per direct report with `findMany` — same pattern the perf commit fixed elsewhere. |
| DB indexes | Weak | Only **2 `@@index`** in whole schema. Hot FK columns unindexed: `TeamTask.assigneeId`, `Attendance.userId/date`, `User.managerId`, `Payroll.userId/year/month`. Highest-ROI perf fix. |
| Code organization | Strong | Clean App Router; server/client separation; `src/lib` pure logic, `src/server` data layer. Minor: duplicate payroll logic in `services/go-backend`; legacy `supabase_queries/` SQL; vestigial `trpc/client.ts`. |
| TypeScript / lint | Weak | `strict: false` (`tsconfig.json:7`); 31 `any` lint warnings (28 in `queries.ts`); `noExplicitAny` only a warning; `eslint.ignoreDuringBuilds: true`. `tsc --noEmit` passes (expected, strict off). |
| Test coverage | Adequate | `vitest run` → 68 passed / 4 skipped (integration gated on staging DB). Component tests not run by default `pnpm test`; Playwright e2e not executable here; `queries.ts` DB logic untested. |
| Build health | Adequate | `.next` builds cleanly (today 14:01); `next.config.ts` healthy (CSP/HSTS, Serwist, Sentry, `optimizePackageImports`). |

**Top perf/quality priorities:** fix the dashboard payroll-period bug; fix `getChainOfCommand` N+1; add the missing DB indexes; enable `strict: true` and eliminate `any`; run component + e2e tests in CI.

---

### 2.3 UX & Accessibility — Rating: ADEQUATE (78/100)

- **Strong:** Real shadcn/ui-style primitives (`src/components/ui/*`); `<nav aria-label>` + `aria-current` + Escape/outside-click popovers (`Layout.tsx`); password toggle `aria-label` (`login/page.tsx`); full keyboard focus rings (`button.tsx`); light/dark themes with WCAG-AA contrast (`globals.css`); **automated axe tests** (`e2e/accessibility.spec.ts`, `@axe-core/playwright`).
- **Gaps:** No `<main>` landmark / skip-to-content link; axe runs chromium-only (no screen-reader/keyboard-only pass); org-chart graph likely not keyboard-navigable; responsive design untested on real breakpoints.

---

### 2.4 Documentation — Rating: ADEQUATE (70/100)

- **Strong:** `README.md` (stack, env setup, migration guidance), `RUNBOOK.md` (secret rotation, DB recovery, incident table), `CONTRIBUTING.md` (conventions, test gates), `CHANGELOG.md` (Keep-a-Changelog).
- **Gaps:** `CHANGELOG.md` + `CONTRIBUTING.md` reference `docs/adr-server-actions-vs-rest.md` which **does not exist** (dangling). `docs/` holds 25 Mermaid diagrams but **zero prose architecture docs** — diagrams alone don't onboard devs. `TODO.md` is scratch only.

---

### 2.5 Deployment & CI/CD — Rating: WEAK (55/100)

- **Strong:** `.github/workflows/ci.yml` runs install → `prisma generate` → `tsc --noEmit` → `next lint` → `vitest run` → `next build` + Go build/vet; security headers in `next.config.ts`; `vercel.json` cron jobs; Sentry/PostHog wired.
- **Weak:** **No deploy step in CI** (no `vercel deploy`/docker/rsync) — relies on undocumented Vercel git-auto-deploy; **no e2e or post-deploy smoke test in CI**; Go PDF service has **no tests and no deployment pipeline**; coverage gate mentioned in CONTRIBUTING but no coverage config exists.

---

### 2.6 Internationalization — Rating: STRONG (88/100)

- Genuine EN/BN (not just claimed): `src/lib/translations.ts` (full `en` + `bn` dictionaries), cookie-driven `i18n-server.ts` + `LangSync.tsx`, `Noto_Sans_Bengali` font + `lang-bn` shaping (`globals.css`), centralized `Intl` formatting with `BDT` / `bn-BD` (`src/lib/format.ts`). BD domain modeling (NID validation, BD holidays 2026, festival bonuses).
- Gaps: manual EN/BN sync drift risk; no locale-based form date input; RTL not needed (Bengali is LTR).

---

### 2.7 Error Handling & Observability — Rating: STRONG (85/100)

- 3-tier error boundaries (`error.tsx`, `global-error.tsx`, `(protected)/error.tsx`) with Sentry capture + reset; structured `logger.ts` (Sentry in prod, console in dev); `MutationError` code contract; Sentry + PostHog (graceful no-op when keys unset). Minor: Sentry reporting gated on `isProd` (silent if `NODE_ENV` misconfigured on staging).

---

## 3. Prioritized Action Plan

### P0 — Fix before any multi-tenant or high-stakes deployment
1. **Enforce tenant isolation** in `src/app/actions/db.ts` (apply `tenantWhere`/`tenantUserWhere`) or unify the two query layers; assign `tenantId` during provisioning. *(Critical — cross-tenant data leak.)*
2. **Secure secrets:** move live secrets out of working `.env` to a secrets manager / CI secret store; **stop reusing the Supabase service-role key as the NID encryption key** (use a dedicated `NID_ENCRYPTION_KEY`); rotate the exposed service-role key.

### P1 — High impact, do next
3. **Fix dashboard payroll trend bug** (`queries.ts:222-229`): filter by payroll `month`/`year`, not `createdAt`.
4. **Fix `getChainOfCommand` N+1** (`queries.ts:417-424`): single `findMany({ where: { managerId: { in: ids } } })` + group in JS.
5. **Add DB indexes** on `TeamTask.assigneeId`, `Attendance(userId, date)`, `User.managerId`, `Payroll(userId, year, month)`.
6. **Strengthen CSRF**: token/double-submit cookie; don't allow "no Origin/Referer" to pass (`middleware.ts:72-75`).
7. **Add CI deploy stage + post-deploy smoke test**; add e2e to CI.

### P2 — Quality & hardening
8. Enable `strict: true`; eliminate `any` (esp. `queries.ts`); run component tests by default.
9. Scope `registry.getAll` PII; add rate limiting to login/reset/invite.
10. Fix notification ownership checks (`db.ts:1460-1473`); remove hardcoded owner-email fallback or require `OWNER_EMAIL`.
11. Fix dangling `docs/adr-server-actions-vs-rest.md` reference; add a prose architecture doc.
12. Run `pnpm audit`; verify resolved `lucide-react` version; remove unused `handlebars`.
13. Add `<main>` landmark + skip-link; run a screen-reader/keyboard-only a11y pass.

---

## 4. Methodology & Caveats
- Findings are evidence-based from static inspection of the working tree at audit date. No runtime exploitation was performed.
- `vitest run` executed locally (68 passed / 4 skipped); `tsc --noEmit` and `eslint` ran clean (with warnings). Playwright e2e and Go service tests were **not executable** in this environment (require live server/DB).
- Ratings reflect the codebase as committed on `main`; the working tree's `.env` was inspected for secrets posture only.
- This report is a snapshot; re-audit after P0/P1 fixes.
