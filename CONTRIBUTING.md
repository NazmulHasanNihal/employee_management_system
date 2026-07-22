# Contributing to EMS

Thanks for contributing! This guide covers local setup, the development
workflow, and the conventions we enforce in CI.

## Prerequisites
- Node.js 20.x
- pnpm (`npm install -g pnpm`)
- A Supabase project (Postgres + Auth). Use a **staging** project for anything
  that writes data — never point local dev at production.
- Go 1.21+ (only if you work on the PDF microservice in `services/go-backend`).

## Setup
```bash
pnpm install                # postinstall runs prisma generate
cp .env.example .env        # fill in Supabase / Postgres / keys
npx prisma db push          # create tables (or: prisma migrate dev)
pnpm dev                    # http://localhost:3000
```

Seed demo data (clears existing data — staging only!):
```bash
pnpm ts-node prisma/seed.ts
```

## Workflow
1. Create a branch off `main`: `git checkout -b feat/short-description`.
2. Make your change. Keep mutations going through
   `executeServerMutation` (see `README.md` → Architecture).
3. Run the local gates before pushing:
   ```bash
   pnpm exec tsc --noEmit
   pnpm exec next lint
   pnpm test
   pnpm run build
   ```
4. Open a PR. CI runs the same gates and **blocks merge on failure**.

## Conventions
- **Type safety:** `any` is allowed but lint *warns* — tighten it when you touch
  a file.
- **Logging:** server code uses `src/lib/logger.ts` (`logError`/`logWarn`), which
  forwards to Sentry in production. Do **not** add raw `console.error` in
  server files.
- **Secrets:** never commit `.env`. A pre-commit hook blocks it. Keep real
  secrets in your secret manager / Vercel env vars.
- **Errors:** mutations throw `MutationError` (from `src/lib/mutation-error.ts`)
  with a `code` (UNAUTHORIZED / VALIDATION / NOT_FOUND / CONFLICT / UNKNOWN).
- **Formatting:** Prettier + ESLint are enforced in CI.

## Tests
- Unit/logic: `src/**/*.test.ts` (Vitest). Run `pnpm test`.
- e2e: Playwright specs under `e2e/` run against a staging database.
- Coverage gate: CI fails under the configured threshold.
