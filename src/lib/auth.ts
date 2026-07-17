import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
  };
}

export function isManagerOrAbove(caller: Caller): boolean {
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
  // The system owner is the head of everything: they must pass every
  // `isAdmin`-gated check (visibility, edits, provisioning) in addition to the
  // CEO-level gates. This is derived only from the authoritative `isOwner`
  // flag, never from the self-editable `designation`.
  const isAdmin = opts.isOwner || opts.role === 'Admin' || opts.role === 'HR Manager';
  const isHR = opts.isOwner || opts.role === 'HR Manager';
  return { isAdmin, isHR, isCEO };
}
