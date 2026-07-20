import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export type Role = 'Employee' | 'Manager' | 'HR Manager' | 'Admin' | 'CEO' | 'Director';

export interface Caller {
  id: string;
  email: string;
  name: string;
  role: string;
  designation: string | null;
  department: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isHR: boolean;
  /** True for CEO role or the system owner. Never derived from a self-editable designation. */
  isCEO: boolean;
  branchId?: string | null;
  /** Active tenant (SaaS). Null in single-tenant deployments. */
  tenantId?: string | null;
  // Extra fields mirrored from the User row so legacy handlers can traverse the
  // manager chain without re-querying. All optional.
  managerId?: string | null;
  avatarUrl?: string | null;
  pushSub?: unknown;
  status?: string;
  isOnboarded?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const OWNER_EMAIL = process.env.OWNER_EMAIL || 'nazmulhas36@gmail.com';

/**
 * Resolves the authenticated user and pre-computes privilege flags.
 *
 * Security model:
 *  - `isOwner` comes from the DB flag only (set during seed / provisioning).
 *  - `isCEO` is true only when the DB `role` is 'CEO' or the user is the owner.
 *    It is intentionally NOT derived from the free-text `designation` field,
 *    which users can edit on their own profile.
 *  - `isAdmin` = role Admin OR HR Manager.
 */
export async function getCaller(): Promise<Caller | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Resolve the Prisma user by email (authoritative, from the verified Supabase
  // session) first, then fall back to the Supabase auth id. Matching by email
  // keeps login working even when the Prisma `id` differs from the Supabase
  // `user.id` (e.g. a seeded owner whose id was set before the auth account
  // existed). The session is already verified by Supabase, so trusting the
  // email is safe.
  const dbUser =
    (user.email
      ? await prisma.user.findUnique({ where: { email: user.email } })
      : null) ??
    (await prisma.user.findUnique({ where: { id: user.id } }));
  if (!dbUser) return null;

  const isOwner = dbUser.isOwner;
  const role = dbUser.role;
  const { isAdmin, isHR, isCEO } = derivePrivileges({ role, isOwner });

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    designation: dbUser.designation,
    department: dbUser.department,
    isOwner,
    isAdmin,
    isHR,
    isCEO,
    branchId: dbUser.branchId,
    tenantId: dbUser.tenantId ?? null,
    managerId: dbUser.managerId,
    avatarUrl: dbUser.avatarUrl,
    status: dbUser.status,
    isOnboarded: dbUser.isOnboarded,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
}

export function isManagerOrAbove(caller: Caller): boolean {
  return caller.isAdmin || caller.isCEO || caller.role === 'Manager' || caller.role === 'Director';
}

/**
 * Server-side authorization guard. Resolves the authenticated caller and
 * redirects to `/` when they are not an admin, HR Manager, CEO, or the system
 * owner. Call this at the top of any admin-only Server Component so the page
 * (and its data) can never be server-rendered for an unauthorized user — hiding
 * the nav link alone is not sufficient, since the URL can be visited directly.
 *
 * Returns the caller for convenience so callers can do:
 *   const caller = await requireAdmin();
 */
export async function requireAdmin(): Promise<Caller> {
  const caller = await getCaller();
  if (!caller || !(caller.isAdmin || caller.isCEO)) {
    redirect('/');
  }
  return caller;
}

/**
 * True when the caller may view organization-wide employee data (the full
 * directory, org chart, and presence grid). Admins, HR, CEO/owner and managers
 * qualify; regular employees do not (they see only their own profile + team).
 */
export function canViewOrg(caller: Caller | null): boolean {
  if (!caller) return false;
  return caller.isAdmin || caller.isCEO || caller.role === 'Manager' || caller.role === 'Director';
}

/**
 * PURE helper: derive privilege flags from authoritative fields only.
 * Extracted so it can be unit-tested without a database. `isCEO` must never
 * be derived from `designation` (which a user can self-edit).
 */
export function derivePrivileges(opts: {
  role: string;
  isOwner: boolean;
}): { isAdmin: boolean; isHR: boolean; isCEO: boolean } {
  const isCEO = opts.isOwner || opts.role === 'CEO';
  // The system owner is treated as CEO. Admin-gated checks elsewhere (e.g.
  // admin.ts, layout gating) include an explicit `|| isOwner` clause, so the
  // owner still passes every admin gate WITHOUT also being flagged `isAdmin`.
  // Keeping `isAdmin` false for the owner matches the privilege spec: owner is
  // CEO, not an Admin/HR role. `isAdmin` is derived only from the authoritative
  // `role`, never from the self-editable `designation`.
  const isAdmin = opts.role === 'Admin' || opts.role === 'HR Manager';
  const isHR = opts.role === 'HR Manager';
  return { isAdmin, isHR, isCEO };
}
