# ADR-001: Server Actions vs REST Route Handlers

**Status:** Accepted
**Date:** 2026-07-17

## Context

The EMS codebase uses **two** mechanisms for server-side data access:

1. **Server Actions** — `src/app/actions/db.ts` exposes a central dispatch router
   (`executeServerQuery`, `executeServerMutation`, `executeServerBatch`) that
   resolves a `path` string (e.g. `leave.create`) to a Prisma call. The client
   calls these via `src/lib/trpc/client.ts`.
2. **REST Route Handlers** — `src/app/api/**/route.ts` (11 endpoints) handle
   webhooks, file uploads, push notifications, and external integrations.

This duality is intentional but was undocumented, leading to inconsistent
patterns (some features used Actions, others REST, with no rule guiding new
code).

## Decision

We standardize on the following convention:

| Concern | Use | Example |
|---------|-----|---------|
| CRUD / domain mutations triggered by UI forms | **Server Actions** (`executeServerMutation`) | Create leave, update profile, delete employee |
| Read data for Server Components | **Server Actions** (`executeServerQuery`) or direct `queries.ts` calls | Dashboard stats, lists |
| External webhooks / 3rd-party callbacks | **REST Route Handler** | `/api/notifications/trigger` (push provider) |
| File uploads (multipart) | **REST Route Handler** | `/api/upload` |
| Realtime / push subscription | **REST Route Handler** | `/api/notifications/subscribe` |
| Anything needing explicit HTTP verbs/status codes for non-browser clients | **REST Route Handler** | Audit export, cron endpoints |

### Rules for new code
- **Prefer Server Actions** for any data operation initiated by the EMS UI.
- **Use REST only** when the caller is not the Next.js app (webhook, external
  service, mobile client) or when multipart upload / streaming is required.
- Every Server Action mutation **must** go through `executeServerMutation` so
  it benefits from auth checks, `revalidatePath`, and structured `MutationError`.
- Every REST route **must** authenticate the caller and return typed JSON
  errors (not raw exceptions).

## Consequences

- New contributors have a clear rule: "UI → Server Action, external → REST."
- The central router remains the single place to enforce cross-cutting
  concerns (auth, revalidation, error typing, Sentry).
- `src/app/actions/db.ts` stays the source of truth for domain mutations; REST
  routes are reserved for integration boundaries.

## Future

If the API surface needs to support non-browser clients at scale, we may extract
a versioned REST API from the Server Action handlers (they already share the
underlying `queries.ts` / Prisma layer), but that is out of scope today.
