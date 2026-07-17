# Changelog

All notable changes to EMS are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project adheres to
Semantic Versioning.

## [Unreleased]

### Added
- Central `revalidatePath` after every mutation (`revalidateForPath` in
  `src/app/actions/db.ts`) — fixes "saved but UI doesn't update" staleness.
- Structured `MutationError` type with codes (UNAUTHORIZED / VALIDATION /
  NOT_FOUND / CONFLICT / UNKNOWN); mutation router reports to Sentry.
- `src/lib/logger.ts` — server-side errors forward to Sentry in production.
- Root `error.tsx` boundary (public routes previously had none).
- Pre-commit hook that blocks committing `.env` / secret patterns.
- Hardened CI: runs `tsc`, `next lint`, `vitest`, and `next build` on every PR.
- `src/server/automation.ts` extracted from the monolithic `db.ts`.
- ADR-001 documenting Server Actions vs REST convention.
- CONTRIBUTING.md, RUNBOOK.md.

### Changed
- `registry.deleteEmployee` cascade wrapped in `prisma.$transaction` (no orphaned
  rows on partial failure).
- ESLint tightened: `no-explicit-any`, `no-unused-vars`, `no-console` now warn.
- Server-side `console.error/warn` replaced with the structured logger.

### Security
- Confirmed no secrets committed to git history; `.env` git-ignored.
- **Action required:** rotate the live credentials currently in `.env` (see
  RUNBOOK.md) — they were exposed on disk.

## [0.1.0] - initial
- Functional MVP: full HR lifecycle modules, Supabase + Prisma, RBAC, PWA,
  command palette, EN/BN i18n, Go PDF microservice.
