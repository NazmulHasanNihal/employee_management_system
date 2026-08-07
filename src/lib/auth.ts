import { cache } from 'react';
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
  permissions?: string[] | null;

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
 * Memoized per request using React cache() to prevent redundant DB & Auth roundtrips.
 */
interface CachedCallerEntry {
  caller: Caller | null;
  timestamp: number;
}
const callerMemoryCache = new Map<string, CachedCallerEntry>();
const CALLER_CACHE_TTL_MS = 15000;

export const getCaller = cache(async (): Promise<Caller | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = Date.now();
  const cached = callerMemoryCache.get(user.id);
  if (cached && now - cached.timestamp < CALLER_CACHE_TTL_MS) {
    return cached.caller;
  }

  const dbUser =
    (user.email
      ? await prisma.user.findUnique({ where: { email: user.email } })
      : null) ??
    (await prisma.user.findUnique({ where: { id: user.id } }));
  if (!dbUser) return null;

  const isOwner = dbUser.isOwner;
  const role = dbUser.role;
  const { isAdmin, isHR, isCEO } = derivePrivileges({ role, isOwner });

  const resolvedCaller: Caller = {
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
    permissions: (dbUser as any).permissions ?? [],
    managerId: dbUser.managerId,

    avatarUrl: dbUser.avatarUrl,
    status: dbUser.status,
    isOnboarded: dbUser.isOnboarded,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };

  callerMemoryCache.set(user.id, { caller: resolvedCaller, timestamp: now });
  return resolvedCaller;
});

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
    redirect('/dashboard');
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
