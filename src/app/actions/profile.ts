'use server';

import { revalidatePath } from 'next/cache';

/**
 * profile.ts — Server actions for the rich (Phase 3) profile page.
 *
 * These back the client islands on /profile. They intentionally do NOT touch
 * db.ts; they use prisma directly and enforce permission rules that mirror the
 * legacy trpc handlers (e.g. self-service can never escalate role/status).
 */

import { prisma } from '@/lib/prisma';
import { getCaller } from '@/lib/auth';
import { validateNid, maskNid, encryptNid } from '@/lib/nid';

// Fields a user may edit on their own profile. Role / status / manager /
// designation / department are NOT self-service (privilege escalation guard).
const SELF_EDITABLE = [
  'phone',
  'bio',
  'dateOfBirth',
  'gender',
  'address',
  'city',
  'country',
  'emergencyContactName',
  'emergencyContactPhone',
  'linkedin',
  'github',
  'twitter',
  'website',
  'avatarUrl',
  'name',
  'branchId',
  // Bangladesh identity fields (Phase B5)
  'nid',
  'bloodGroup',
  'religion',
  'preferredLanguage',
] as const;

type SelfEditableField = (typeof SELF_EDITABLE)[number];

// Fields an admin/HR may additionally edit (employment details). `status` and
// `managerId` are restricted to full admins; `designation`, `department`,
// `employmentType`, `baseSalary`, and `joinDate` may also be edited by HR.
const ADMIN_EDITABLE = [
  'employmentType',
  'department',
  'designation',
  'status',
  'baseSalary',
  'managerId',
  'joinDate',
] as const;

// Fields HR managers (but not necessarily full admins) may edit. Subset of
// ADMIN_EDITABLE excluding the escalation-sensitive status/managerId.
const HR_EDITABLE = ['employmentType', 'department', 'designation', 'baseSalary', 'joinDate'] as const;

// True when the caller may edit employment details. Full admins may edit every
// ADMIN_EDITABLE field; HR managers may edit the HR_EDITABLE subset.
function canEditEmploymentField(caller: { isAdmin: boolean; isHR: boolean }, field: string): boolean {
  if ((ADMIN_EDITABLE as readonly string[]).includes(field) && caller.isAdmin) return true;
  if ((HR_EDITABLE as readonly string[]).includes(field) && caller.isHR) return true;
  return false;
}

export async function updateProfileField(field: string, value: unknown) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');

  const isSelfField = (SELF_EDITABLE as readonly string[]).includes(field);
  const isEmploymentField = canEditEmploymentField(caller, field);

  if (!isSelfField && !isEmploymentField) {
    throw new Error('Not allowed to edit this field');
  }

  // Normalize empty strings to null for optional fields.
  const normalized = value === '' ? null : value;
  if (field === 'dateOfBirth' && typeof normalized === 'string') {
    const d = new Date(normalized);
    await prisma.user.update({ where: { id: caller.id }, data: { dateOfBirth: d } });
    return { ok: true };
  }
  if (field === 'joinDate' && typeof normalized === 'string') {
    const d = new Date(normalized);
    await prisma.user.update({ where: { id: caller.id }, data: { joinDate: d } });
    return { ok: true };
  }
  if (field === 'baseSalary') {
    const num = normalized == null ? null : Number(normalized);
    await prisma.user.update({ where: { id: caller.id }, data: { baseSalary: num } });
    return { ok: true };
  }
  if (field === 'branchId' && normalized == null) {
    // Allow clearing the branch assignment.
    await prisma.user.update({ where: { id: caller.id }, data: { branchId: null } });
    return { ok: true };
  }

  await prisma.user.update({
    where: { id: caller.id },
    data: { [field]: normalized },
  });
  revalidatePath('/registry');
  return { ok: true };
}

export async function updateProfileBatch(
  updates: Record<string, unknown>
) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');

  const data: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(updates)) {
    const isSelfField = (SELF_EDITABLE as readonly string[]).includes(key);
    const isEmploymentField = canEditEmploymentField(caller, key);
    if (!isSelfField && !isEmploymentField) {
      // skip disallowed fields silently
      continue;
    }
    // NID is encrypted at rest. A null value means "unchanged" — preserve the
    // existing ciphertext rather than blanking it. A non-empty value is
    // validated, masked for display, and encrypted before storage.
    if (key === 'nid') {
      if (val == null || val === '') continue;
      const digits = String(val).replace(/\D/g, '');
      const fmt = validateNid(digits);
      if (!fmt) throw new Error('Invalid Bangladesh NID (expected 10, 13, or 17 digits)');
      data.nid = encryptNid(digits);
      data.nidMasked = maskNid(digits);
      continue;
    }
    data[key] = val === '' ? null : val;
  }
   if (Object.keys(data).length === 0) return { ok: true };

  await prisma.user.update({ where: { id: caller.id }, data });
  revalidatePath('/registry');
  return { ok: true };
}

export async function addSkill(skill: string, level = 1) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  const trimmed = skill.trim();
  if (!trimmed) throw new Error('Skill required');
  const clampedLevel = Math.max(1, Math.min(5, Number(level) || 1));
  // Avoid duplicates.
  const existing = await prisma.skill.findFirst({
    where: { userId: caller.id, skill: trimmed },
  });
  if (existing) {
    return await prisma.skill.update({
      where: { id: existing.id },
      data: { level: clampedLevel },
    });
  }
  return await prisma.skill.create({
    data: { userId: caller.id, skill: trimmed, level: clampedLevel },
  });
}

export async function removeSkill(skill: string) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  await prisma.skill.deleteMany({ where: { userId: caller.id, skill } });
  return { ok: true };
}

export async function uploadDocument(title: string, url: string, type = 'General') {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  if (!title || !url) throw new Error('Title and URL required');
  return await prisma.document.create({
    data: { title, url, type, ownerId: caller.id },
  });
}

export async function updateAvatarUrl(url: string) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  if (!url) throw new Error('URL required');
  await prisma.user.update({
    where: { id: caller.id },
    data: { avatarUrl: url },
  });
  revalidatePath('/registry');
  return { ok: true };
}

/**
 * Records an avatar change in the ProfilePhotoHistory table so the user keeps a
 * timeline of past profile pictures. Call this right after a successful upload.
 */
export async function recordPhotoHistory(url: string) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  if (!url) throw new Error('URL required');
  return await prisma.profilePhotoHistory.create({
    data: { userId: caller.id, url },
  });
}

/**
 * Delegation: assign (or clear) a proxy who may act on this user's behalf.
 * Only the user themselves may set their own proxy. `validUntil` is optional.
 */
export async function setProxy(proxyId: string | null, validUntil?: string | null) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  // Prevent self-delegation loops.
  if (proxyId && proxyId === caller.id) throw new Error('You cannot delegate to yourself');
  const data: { proxyId: string | null; proxyValidUntil?: Date | null } = { proxyId: proxyId || null };
  if (proxyId) {
    data.proxyValidUntil = validUntil ? new Date(validUntil) : null;
  }
  await prisma.user.update({ where: { id: caller.id }, data });
  return { ok: true };
}
