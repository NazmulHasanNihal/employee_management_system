# Runbook — Operations & Incident Response

Practical procedures for deploying, recovering, and operating EMS.

## Environment variables
All required keys are listed in `.env.example`. Critical ones:

| Variable | Purpose | Rotate if |
|----------|---------|-----------|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres pooler | Suspected leak / offboarding |
| `NEXT_SUPABASE_SERVICE_ROLE_KEY` | Full DB admin (server-only) | **Any** exposure — highest risk |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key | Low risk (RLS-protected) |
| `SENTRY_AUTH_TOKEN` | Sentry upload | Team member leaves |
| `VAPID_PRIVATE_KEY` | Web Push | Suspected leak |
| `UPSTASH_REDIS_REST_TOKEN` | Redis/BullMQ | Suspected leak |
| `INVITE_SECRET` | Invite token signing | Periodic / suspected leak |

> Never commit `.env`. A pre-commit hook blocks it. Store real values in your
> secret manager / Vercel project env vars.

## Rotating secrets (incident or routine)
1. In Supabase Dashboard → Project Settings → Keys, roll the **service role**
   and database password.
2. In Sentry / VAPID / Upstash, generate new credentials.
3. Update `.env` locally and the Vercel project env vars.
4. Redeploy (Vercel picks up new env on build).
5. Verify login + one write action works post-rotation.

## Database recovery
- **Schema:** changes go through `prisma migrate dev` → `migrate deploy`
  (preferred) or `prisma db push` for quick staging sync.
- **Disaster recovery:** Supabase provides point-in-time recovery. For a full
  reset on staging: `prisma db push --force-reset && pnpm ts-node prisma/seed.ts`.
- **Orphaned records:** the `registry.deleteEmployee` mutation wraps all
  cascading deletes in a `prisma.$transaction`, so a failed delete cannot leave
  dangling attendance/leave/payroll rows.

## Admin / owner provisioning
- The system owner (CEO) is the email in `OWNER_EMAIL`. Scripts in `scripts/`
  can create or reset an admin if auth/DB get out of sync:
  ```bash
  pnpm ts-node scripts/create-admin.ts
  pnpm ts-node scripts/force-reset-password.ts
  ```

## Deploy
- **Frontend:** Vercel (config in `vercel.json`). CI builds on every PR.
- **PDF microservice:** `services/go-backend` (Go/Fiber). Deploy as a separate
  service; document its host in `NEXT_PUBLIC_PARTYKIT_HOST` or the PDF route.
- **Preview:** every PR gets a Vercel preview deploy for staging smoke tests.

## Monitoring
- **Errors:** Sentry captures exceptions from error boundaries, the mutation
  router, and API routes.
- **Usage:** PostHog funnels (login → first action).
- **Health:** add an uptime check against the Go service and the Supabase DB.

## Common incidents
| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Login loop | Prisma user missing for Supabase auth user | `scripts/create-admin.ts` |
| Saved data not visible | Missing `revalidatePath` | Ensure mutation path maps in `revalidateForPath` |
| 500 on write | `MutationError` in Sentry | Check `code` (UNAUTHORIZED = perms, VALIDATION = bad input) |
| Push not working | VAPID mismatch | Re-roll VAPID pair, redeploy |
