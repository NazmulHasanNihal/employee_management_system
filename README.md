# Employee Management System (EMS)

A full-featured HR / employee-management platform built with **Next.js 15 (App Router)**, **Supabase Auth + Postgres**, **Prisma**, and **Tailwind**. It covers the employee lifecycle end-to-end: onboarding, attendance, leave, payroll, performance, recruitment, compliance, benefits, and internal communications — wrapped in a polished "ledger/terminal" themed UI with offline support, a command palette, and bilingual (EN/BN) support.

> Status: functional MVP. All major modules are backed by real database handlers (Prisma). Authorization is role-based (Employee / Manager / HR Manager / Admin / CEO + an immutable system owner).

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, React 19, Turbopack) |
| Auth & DB | Supabase (Auth + Postgres) via Prisma |
| Styling | Tailwind CSS 4, Framer Motion, shadcn-style UI primitives |
| Realtime / presence | Supabase Realtime (broadcast channels) |
| PDF generation | Go (Fiber) microservice (`services/go-backend`) |
| Observability | Sentry, PostHog |
| PWA | Serwist service worker |
| Tests | Vitest (unit tests for RBAC, hierarchy, payroll) |

---

## Getting started

### 1. Install dependencies
```bash
pnpm install
# or: npm install
```
`postinstall` runs `prisma generate` automatically.

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in the Supabase / Postgres values (see `.env.example` for every variable and its meaning). Key ones:
- `DATABASE_URL` / `DIRECT_URL` — Supabase pooler URLs
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_SUPABASE_SERVICE_ROLE_KEY`
- `OWNER_EMAIL` — the email granted system-owner (CEO) privileges

### 3. Sync the database
```bash
npx prisma db push      # create/update tables (or: prisma migrate dev)
pnpm ts-node prisma/seed.ts   # populate demo data (clears existing data!)
```
> Recent schema changes added `AutomationRule`, `TicketReply`, and `User.lastSeen`/`isOnline`.
> Run `prisma db push` (or a new migration) after pulling so these tables exist.

### Database migrations (reproducible schema — P1)
For anything beyond a throwaway dev DB, prefer **migrations** over `db push` so schema
changes are versioned and reproducible across environments:

1. **Staging first.** Point a staging `DATABASE_URL`/`DIRECT_URL` at a staging database
   (never mutate prod directly):
   ```bash
   DATABASE_URL="postgresql://.../ems_staging" DIRECT_URL="postgresql://.../ems_staging" \
     npx prisma migrate dev --name <what_changed>
   ```
   This generates `prisma/migrations/<timestamp>_<what_changed>/migration.sql`, applies it,
   and updates `prisma/migrations_lock.toml`.
2. **Commit** the migration SQL + lock file. CI can then run `prisma migrate deploy` against
   preview/prod (which applies pending migrations without generating new ones — safe for
   serverless/CI where `migrate dev` cannot run interactively).
3. **Prod apply:** `npx prisma migrate deploy` (uses `DATABASE_URL` from the environment).
4. **Seed** only non-prod datasets; `prisma/seed.ts` clears existing data, so never run it
   against production.

> App-layer changes in this codebase (e.g. NID encryption-at-rest, statutory leave policy)
> intentionally avoid schema migrations for now — they store derived/encrypted values in
> existing columns. When you promote those to first-class columns, follow the flow above.

### 4. Run the app
```bash
pnpm dev
```
This starts the Next.js dev server (Turbopack). Open http://localhost:3000.
Real-time presence runs over **Supabase Realtime** (no separate process) — make
sure Realtime is enabled for your Supabase project.

### 5. (Optional) Run the Go PDF service
```bash
cd services/go-backend
go run main.go            # listens on :8080
# expects PAYROLL_API_TOKEN + PAYROLL_CORS_ORIGIN env vars
```

### 6. Real-time attendance presence (Supabase Realtime)
The attendance page live-refreshes manager "Live Office Status" panels via
**Supabase Realtime** broadcast channels (`src/lib/useRealtimePresence.ts`) — no
separate server to run or deploy. Ensure Realtime is enabled for your Supabase
project (Dashboard → Database → Replication). The client degrades to manual
refresh if the channel can't connect.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the Next.js dev server (Turbopack) |
| `pnpm dev:next` | Start only the Next.js dev server (Turbopack) |
| `pnpm build` | Production build (type errors now fail the build) |
| `pnpm start` | Run the production build |
| `pnpm test` | Run the Vitest unit test suite |
| `pnpm lint` | ESLint (Next.js config) |
| `pnpm test:e2e` | Run the Playwright E2E suite |
| `npx prisma studio` | Inspect the database |
| `pnpm ts-node prisma/seed.ts` | Reseed demo data |

---

## Architecture

```
src/
  app/
    (protected)/        # Authenticated pages (dashboard, payroll, hr, ...)
    api/                # Route handlers (upload, audit, hierarchy, onboarding)
    actions/db.ts       # Server actions: executeServerQuery / executeServerMutation
  lib/
    auth.ts             # getCaller() — single source of truth for privileges
    hierarchy.ts        # Manager-chain rank + canModifyUser()
    payroll.ts          # Pure payroll calculation (unit-tested)
    prisma.ts           # Prisma client singleton
    trpc/client.ts      # Thin proxy mapping UI calls to the server actions
  components/           # UI components (Layout, Dashboard, domain widgets)
prisma/
  schema.prisma         # 30+ models across all HR domains
  seed.ts               # Demo data
services/go-backend/    # Go Fiber PDF microservice
```

### Data-fetching model
The UI calls a typed `trpc.<domain>.<method>` proxy (`src/lib/trpc/client.ts`). The proxy forwards each call to a server action `executeServerQuery(path)` / `executeServerMutation(path)` in `src/app/actions/db.ts`, which dispatches on the dotted `path` string to the appropriate Prisma query/mutation. All handlers enforce RBAC via `getCaller()`.

> Note: the `trpc` proxy is a lightweight shim over Next.js Server Actions — there is no separate tRPC/ConnectRPC server (the earlier proto/ConnectRPC layer was removed as dead code).

### Authorization
- `getCaller()` returns `{ isAdmin, isHR, isCEO, isOwner, ... }`.
- **`isCEO` is derived only from `role === 'CEO'` or the DB `isOwner` flag — never from the free-text `designation` field** (which users can edit). This prevents privilege escalation.
- The system owner (email in `OWNER_EMAIL`) is immutable and cannot be demoted or offboarded.

### Authentication & onboarding flow
- **Invite (real email):** `provisionEmployeeAccount` (invite mode) mints a signed invite token (`src/lib/invite.ts`) and calls `supabase.auth.admin.inviteUserByEmail` so the employee receives a real invite email. Supabase's email link lands at `/auth/callback` (which exchanges the `token_hash`/`code` for a session), then routes to `/`. If Supabase email transport is unavailable, the signed token is still returned to the admin as a manual copy-link (`/invite/[token]`).
- **Auth callback:** `src/app/auth/callback/route.ts` handles OAuth, magic-link, and email-invitation redirects by exchanging the credential for a session cookie, then redirecting to `next` (default `/`).
- **Verify-email gate:** authenticated users with an unconfirmed auth email are redirected to `/verify-email` (which can resend the confirmation) until `email_confirmed` is true. Invited users who set a password via `/api/invite/accept` get `email_confirm: true`, so they pass through immediately.
- **Onboarding gate:** users with `isOnboarded = false` are shown `OnboardingFlow` to complete profile/NID before reaching the app shell.

---

## Feature coverage

| Module | Status |
|--------|--------|
| Dashboard, News/Announcements, Calendar, Team/Tasks, Org Chart | Full |
| Attendance (clock in/out), Leave, Expenses, Assets, Helpdesk, Audit Log | Full |
| Shifts & roster, Performance (OKRs/Reviews), Recruitment (ATS), Compliance (certs/whistleblower) | Full |
| Benefits & Equity, DEI bias audit, Recognition (Kudos), Feedback, Documents, Profile skills, Payroll structures, Workflows (onboarding/offboarding/probation) | Full |

---

## Security notes
- **Secrets:** `.env` is gitignored and must never be committed. Rotate `DATABASE_URL`, `NEXT_SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `UPSTASH_REDIS_REST_TOKEN`, and `POSTHOG_KEY` immediately if a live `.env` was ever shared or backed up — the service_role key bypasses all Row-Level Security.
- **Authorization:** every mutating server action in `src/app/actions/db.ts` enforces `isAdmin`/`isCEO` (field allow-lists strip `role`/`isOwner`/`designation` from client updates). `provisionEmployeeAccount` and `registry.*`/`payroll.createHead` are gated.
- **API hardening:** `/api/notifications/trigger` and the Go `/api/reports/attendance-pdf` endpoint now require authentication (Bearer token / session). Unauthenticated push-to-any-user is closed.
- **Uploads:** `/api/upload` requires auth, validates **magic bytes** (not just the extension), enforces an allowlist + 10 MB cap, and sanitizes filenames. In production, swap local `public/uploads` for Supabase Storage / S3 (serverless-incompatible as written).
- **Privilege model:** `isCEO` is derived only from `role === 'CEO'` or the DB `isOwner` flag — never from the self-editable `designation` field — preventing escalation. The owner cannot be offboarded.
- **Scripts:** `scripts/create-real-admin.ts` reads the password from `ADMIN_PASSWORD` (no hardcoded creds) and never prints secrets.
- **Build:** `next.config.ts` fails the build on TypeScript errors; the tRPC proxy's `invalidate()` now actually refetches (no `window.location.reload()` hacks remain).

## Testing
```bash
pnpm test
```
Covers: role hierarchy / privilege rules, CEO-spoof prevention, and payroll math.
