'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCaller } from '@/lib/auth';
import { validateNid, maskNid, encryptNid } from '@/lib/nid';
import { wouldCreateCircularHierarchy } from '@/lib/hierarchy';

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

// Fields an admin/HR/CEO may edit (employment details).
const ADMIN_EDITABLE = [
  'employmentType',
  'department',
  'designation',
  'status',
  'baseSalary',
  'managerId',
  'joinDate',
] as const;

// Fields HR managers may edit.
const HR_EDITABLE = ['employmentType', 'department', 'designation', 'baseSalary', 'joinDate', 'managerId'] as const;

function canEditEmploymentField(caller: { isAdmin: boolean; isHR: boolean; isCEO?: boolean }, field: string): boolean {
  if (caller.isCEO || caller.isAdmin) return true;
  if ((HR_EDITABLE as readonly string[]).includes(field) && caller.isHR) return true;
  return false;
}

export async function updateProfileField(field: string, value: unknown, targetUserId?: string) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');

  const isPrivileged = caller.isAdmin || caller.isCEO || caller.isHR;
  const targetId = targetUserId && isPrivileged ? targetUserId : caller.id;

  const isSelfField = (SELF_EDITABLE as readonly string[]).includes(field);
  const isEmploymentField = canEditEmploymentField(caller, field);

  if (!isSelfField && !isEmploymentField) {
    throw new Error('Not allowed to edit this field');
  }

  // Circular hierarchy guard for manager assignment
  if (field === 'managerId' && value) {
    const allUsers = await prisma.user.findMany({ select: { id: true, managerId: true } });
    if (wouldCreateCircularHierarchy(targetId, String(value), allUsers)) {
      throw new Error('Cannot assign manager: this would create a circular management loop.');
    }
  }

  // Normalize empty strings to null for optional fields.
  const normalized = value === '' ? null : value;

  if (field === 'dateOfBirth' && typeof normalized === 'string') {
    const d = new Date(normalized);
    await prisma.user.update({ where: { id: targetId }, data: { dateOfBirth: d } });
  } else if (field === 'joinDate' && typeof normalized === 'string') {
    const d = new Date(normalized);
    await prisma.user.update({ where: { id: targetId }, data: { joinDate: d } });
  } else if (field === 'baseSalary') {
    const num = normalized == null ? null : Number(normalized);
    await prisma.user.update({ where: { id: targetId }, data: { baseSalary: num } });
  } else if (field === 'branchId' && normalized == null) {
    await prisma.user.update({ where: { id: targetId }, data: { branchId: null } });
  } else {
    await prisma.user.update({
      where: { id: targetId },
      data: { [field]: normalized },
    });
  }

  revalidatePath('/', 'layout');
  revalidateTag('org-tree');
  revalidateTag('employees');
  return { ok: true };
}

export async function updateProfileBatch(
  updates: Record<string, unknown>,
  targetUserId?: string
) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');

  const isPrivileged = caller.isAdmin || caller.isCEO || caller.isHR;
  const targetId = targetUserId && isPrivileged ? targetUserId : caller.id;

  const data: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(updates)) {
    const isSelfField = (SELF_EDITABLE as readonly string[]).includes(key);
    const isEmploymentField = canEditEmploymentField(caller, key);
    if (!isSelfField && !isEmploymentField) {
      continue;
    }
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

  await prisma.user.update({ where: { id: targetId }, data });
  revalidatePath('/', 'layout');
  revalidateTag('org-tree');
  revalidateTag('employees');
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

export async function updateAvatarUrl(url: string, targetUserId?: string) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  if (!url) throw new Error('URL required');

  const updateId = targetUserId || caller.id;
  if (targetUserId && targetUserId !== caller.id) {
    throw new Error('Unauthorized: Only the user can change their own profile picture.');
  }

  await prisma.user.update({
    where: { id: updateId },
    data: { avatarUrl: url },
  });
  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Records an avatar change in the ProfilePhotoHistory table so the user keeps a
 * timeline of past profile pictures. Call this right after a successful upload.
 */
export async function recordPhotoHistory(url: string, targetUserId?: string) {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');
  if (!url) throw new Error('URL required');

  const updateId = targetUserId || caller.id;
  if (targetUserId && targetUserId !== caller.id) {
    if (!caller.isAdmin && !caller.isCEO && caller.role !== 'HR Manager') {
      throw new Error('Unauthorized');
    }
  }

  return await prisma.profilePhotoHistory.create({
    data: { userId: updateId, url },
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

/**
 * Account Deletion & Data Anonymization Flow (GDPR / Privacy Compliance).
 * Allows a user to delete their account by anonymizing all personal PII while
 * preserving statutory financial audit records without personal identifiers.
 * Prevents system owner (isOwner === true) self-deletion to prevent lockout.
 */
export async function deleteOwnAccount() {
  const caller = await getCaller();
  if (!caller) throw new Error('Unauthorized');

  // Prevent system owner lockout
  if (caller.isOwner) {
    throw new Error('System owner account cannot be deleted. Transfer ownership first.');
  }

  const userId = caller.id;
  const anonymizedEmail = `deleted-${userId.substring(0, 8)}@deleted.local`;

  // Anonymize personal details in PostgreSQL DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Anonymized User',
      email: anonymizedEmail,
      phone: null,
      bio: null,
      dateOfBirth: null,
      address: null,
      city: null,
      country: null,
      nid: null,
      nidMasked: null,
      avatarUrl: null,
      status: 'deleted',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      pushSub: Prisma.JsonNull,
    },
  });

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Account and personal data have been anonymized.' };
}
