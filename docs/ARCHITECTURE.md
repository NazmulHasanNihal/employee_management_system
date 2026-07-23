# OpsHub Architecture Overview

## 1. High-Level Architecture

OpsHub is a full-stack HR platform built on modern web technologies:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  Next.js 15 (App Router) + React 19 + Tailwind CSS v4         │
│  PWA via Serwist, Offline Support, Real-time via Supabase      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Edge Runtime                                │
│  Next.js Middleware (CSRF, Auth Redirect, IP Allowlist)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌────────────────────┐      ┌──────────────────────────┐
│   Next.js Server   │      │   Server Actions          │
│   Components       │──────│   (src/app/actions/)      │
│   (RSC)           │      │   executeServerQuery/Mutation│
└────────────────────┘      └──────────┬───────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   Prisma ORM     │
                              │   (PostgreSQL)   │
                              └────────┬─────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   Supabase       │
                              │   (Auth + DB)    │
                              └──────────────────┘
```

## 2. Data Fetching Model

The UI uses a lightweight tRPC shim (`src/lib/trpc/client.ts`) that maps dotted paths to server actions:

- `trpc.attendance.clockIn()` → `executeServerMutation('attendance.clockIn')`
- `trpc.dashboard.getStats()` → `executeServerQuery('dashboard.getStats')`

This provides:
- Type-safe client calls without a separate tRPC server
- Automatic invalidation via `useUtils().invalidate()`
- Batched queries via `useQueries()`

## 3. Authentication & Authorization

### Flow
1. User authenticates via Supabase Auth (email/password, magic link, OAuth)
2. Session cookie is set by `@supabase/ssr`
3. Middleware validates session on every request
4. `getCaller()` resolves the Prisma user and computes privilege flags
5. Server actions enforce RBAC via `requireAdmin()` or explicit checks

### RBAC Matrix
| Role | Admin Surfaces | Employee Data | Team Data | Payroll | Settings |
|------|---------------|---------------|-----------|---------|----------|
| Owner | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| Admin | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| HR Manager | ✅ Most | ✅ All | ✅ All | ✅ All | ❌ None |
| Manager | ❌ None | Team only | Team only | ❌ None | ❌ None |
| Employee | ❌ None | Own only | Own only | Own only | ❌ None |

## 4. Database Layer

### Prisma Models (60+)
- **Core:** User, Department, Branch, Tenant, Team
- **Time:** Attendance, Shift, ShiftAssignment, Holiday, LeaveRequest, LeaveType
- **Payroll:** Payroll, SalaryHead, SalaryStructure, Payment, FestivalBonus, Penalty, Sale, StatutoryCalc
- **Performance:** Objective, Review, ReviewScore, CalibrationSession, CalibrationEntry
- **Recruitment:** JobRequisition, Candidate
- **Compliance:** Certification, WhistleblowerReport, AuditLog, AutomationRule
- **Engagement:** Notification, GreetingRule, GreetingLog, Kudo, Message
- **Assets:** Asset, Document, DocumentTemplate
- **Benefits:** Benefit, BenefitEnrollment, EnrollmentPeriod, EquityGrant
- **Training:** TrainingCourse, TrainingEnrollment
- **Other:** Expense, Ticket, TicketReply, Feedback, CalendarEvent, Event, CompanyNews, ProfilePhotoHistory, OnboardingTask, SystemSetting

### Key Relations
- User → Manager (self-referential)
- User → Proxy (delegation)
- User → Branch → Tenant (multi-tenancy)
- Payroll → SalaryStructure → SalaryHead (many-to-many)

## 5. Real-Time Features

Supabase Realtime powers:
- **Presence grid:** Active users shown in real-time
- **Notifications:** Push + in-app notifications
- **Attendance:** Live clock-in/out updates

Degradation: If Realtime can't connect, features fall back to manual refresh.

## 6. Security Architecture

### Defense in Depth
1. **Edge:** CSRF middleware blocks cross-origin mutations
2. **Auth:** Supabase Auth with email verification
3. **2FA:** TOTP authenticator with AES-256-GCM encrypted secrets
4. **RBAC:** Server-side privilege checks on every action
5. **Validation:** Zod schemas on all inputs
6. **Rate Limiting:** Upstash Redis on login/provision endpoints
7. **Encryption:** NID and TOTP secrets encrypted at rest
8. **IP Allowlist:** Optional CIDR-based admin route protection
9. **Audit Log:** Event log with actor/target/details

### Secret Management
- `.env` gitignored
- Rotation script provided (`scripts/rotate-secrets.js`)
- Different keys for different purposes (NID, TOTP, invite, cron, VAPID)

## 7. Background Jobs

Vercel Cron schedules:
- `0 8 * * *` — Daily greetings (birthdays, anniversaries, festivals)
- `30 23 * * *` — Daily absence detection
- `0 6 * * *` — Database health check
- `0 2 * * *` — Backup trigger

Heavy jobs (PDF generation) are offloaded to the Go microservice (`services/go-backend/`).

## 8. Error Handling & Observability

- **Sentry:** Error tracking with 4xx noise filter
- **PostHog:** Product analytics
- **Web Vitals:** CLS, INP, LCP reported
- **Structured logging:** `src/lib/logger.ts`
- **Error classification:** `src/lib/mutation-error.ts` maps errors to typed codes

## 9. Deployment

- **Platform:** Vercel (serverless)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash Redis
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + PostHog

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public Supabase
- `NEXT_SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase admin
- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL connections
- `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — Push notifications
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Rate limiting
- `INVITE_SECRET` — Invite token signing
- `CRON_SECRET` — Cron endpoint auth
- `NID_ENCRYPTION_KEY` — NID field encryption
- `TOTP_ENCRYPTION_KEY` — 2FA secret encryption
- `POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_KEY` — Analytics

## 10. Extensibility

### Adding a New Integration
1. Create a class implementing `IntegrationAdapter` in `src/lib/integrations.ts`
2. Register it conditionally based on env vars
3. Call `sendIntegrationNotification()` from notification triggers

### Adding a New Server Action
1. Add handler in `src/app/actions/db.ts`
2. Call via `trpc.<domain>.<method>()` in the UI
3. Enforce RBAC using `getCaller()` and `requireAdmin()`

### Adding a New Model
1. Add model to `prisma/schema.prisma`
2. Run `pnpm exec prisma migrate dev --name <name>`
3. Query via Prisma in server actions/queries
