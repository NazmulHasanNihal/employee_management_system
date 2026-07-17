# Penetration Test Checklist (Tier 10)

Run against a **staging** deploy. Do NOT pen-test production without written
authorization. Each item maps to a control already present in code — verify it
holds under adversarial input.

## 1. Authentication & session
- [ ] Cannot access `/<protected>` routes without a valid session (redirect to /login).
- [ ] Session cookie is `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- [ ] Logging in as Employee does NOT grant Admin/HR routes (role enforced server-side, not just hidden in UI).
- [ ] `OWNER_EMAIL` privilege cannot be escalated via self-update (see `profile.updateMyProfile` blocklist in `actions/db.ts`).

## 2. IDOR (Object-level authorization) — highest risk
- [ ] User A cannot read/edit User B's record by swapping `id` in a mutation path.
  - Verify `registry.updateEmployee` only allows the allow-list fields.
  - Verify `registry.deleteEmployee` uses `canModifyUser(freshCaller, targetUser)`.
- [ ] Leave/payroll/expense records are scoped to `caller.id` or `caller.branchId`.
- [ ] `query` paths that take a `userId` reject cross-user access.

## 3. Authorization bypass
- [ ] `MutationError` code `UNAUTHORIZED` returned for admin-only mutations when called by a non-admin (verify via a non-admin token).
- [ ] API routes (`/api/upload`, `/api/notifications/*`) reject unauthenticated requests.

## 4. Rate limiting
- [ ] `lib/ratelimit.ts` (Redis/Upstash) blocks burst requests (e.g. >N login attempts).
- [ ] Confirm a 429 after exceeding the limit; confirm the limit is per-IP or per-user.

## 5. Input validation
- [ ] `lib/validation.ts` rejects malformed `path`/input at the edge (parseServerAction).
- [ ] SQL injection impossible via Prisma parameterized queries (no raw string SQL).
- [ ] XSS: all user content rendered as text, not `dangerouslySetInnerHTML`.

## 6. Secrets & config
- [ ] No secrets in client bundles (`NEXT_PUBLIC_*` only contains non-sensitive keys).
- [ ] `.env` not committed (pre-commit hook + gitignore).
- [ ] RLS enabled on Supabase tables as defense-in-depth even though Prisma enforces auth.

## 7. Dependencies
- [ ] `pnpm audit` clean (or only low-severity).
- [ ] Sentry source maps do not leak secrets.

## Tools
- Manual via the e2e/critical-path Playwright spec with a non-privileged account.
- `pnpm audit` for dependencies.
- Optional: run `zap` or `burp` passive scan against the staging URL.
