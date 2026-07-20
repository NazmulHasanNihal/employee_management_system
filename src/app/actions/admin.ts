'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createInviteToken } from '@/lib/invite';
import { validateNid, maskNid, encryptNid } from '@/lib/nid';
import { getSiteUrl } from '@/lib/site';
import { rateLimit, provisionKey } from '@/lib/ratelimit';
import { logError, logWarn } from '@/lib/logger';

export async function getUserRoleByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user?.role || 'Employee';
  } catch (error) {
    return 'Employee';
  }
}

export interface ProvisionInput {
  name: string;
  email: string;
  role?: string;
  department?: string;
  designation?: string;
  managerId?: string | null;
  branchId?: string | null;
  employmentType?: string;
  joinDate?: string | null;
  baseSalary?: number | null;
  nid?: string | null;
  // Invite mode: when true, no password is set; a signed invite link is minted
  // and the employee sets their own password. Falls back to forced-create when
  // Supabase invite email transport is unavailable.
  invite?: boolean;
  password?: string;
}

export async function provisionEmployeeAccount(data: ProvisionInput) {
  try {
    // ── Authorization ──
    const caller = await getCaller();
    const isPrivileged =
      caller?.isAdmin || caller?.isHR || caller?.isCEO || caller?.isOwner;
    if (!caller || !isPrivileged) {
      throw new Error('Unauthorized: only admins can provision accounts');
    }

    // Rate-limit provisioning per admin to blunt abuse / accidental spam.
    const limit = await rateLimit(provisionKey(caller.id, null));
    if (!limit.success) {
      throw new Error('Too many accounts provisioned recently. Please try again later.');
    }

    const email = data.email?.trim().toLowerCase();
    if (!email || !data.name?.trim()) {
      throw new Error('Name and email are required');
    }

    const role = data.role || 'Employee';

    // Validate NID if supplied.
    let nidMasked: string | null = null;
    let nidRaw: string | null = null;
    if (data.nid) {
      const fmt = validateNid(data.nid);
      if (!fmt) {
        throw new Error('Invalid Bangladesh NID (expected 10, 13, or 17 digits)');
      }
      nidRaw = data.nid.replace(/\D/g, '');
      nidMasked = maskNid(nidRaw);
      // Encrypt at rest: store ciphertext in `nid`, keep mask for display.
      nidRaw = encryptNid(nidRaw) ?? nidRaw;
    }

    const adminAuth = createAdminClient().auth;
    const adminAuthAdmin = adminAuth.admin;

    const inviteMode = data.invite === true;

    // Resolve base salary / employment fields.
    const baseSalary =
      data.baseSalary == null ? null : Number(data.baseSalary);
    const joinDate = data.joinDate ? new Date(data.joinDate) : null;

    let authUserId: string | null = null;
    let inviteToken: string | null = null;
    let accountStatus = 'active';

    if (inviteMode) {
      // Mint a signed invite token; create the auth user without a password.
      const { data: authData, error: authError } = await adminAuthAdmin.createUser({
        email,
        email_confirm: false,
        user_metadata: { name: data.name, role },
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create auth user');
      authUserId = authData.user.id;
      inviteToken = createInviteToken(email, role);
      accountStatus = 'invited';

      // Send the real invite email via Supabase Auth. Supabase delivers the
      // email containing its own magic-link; clicking it lands at our
      // /auth/callback handler (which exchanges the token hash for a session)
      // and then routes the new user into onboarding where they set their password.
      const origin = getSiteUrl();
      const redirectTo = `${origin}/auth/callback?next=/`;
      try {
        const { error: inviteErr } = await adminAuthAdmin.inviteUserByEmail(email, {
          redirectTo,
        });
        if (inviteErr) {
          logWarn(
            `Supabase invite email not sent for ${email} (${inviteErr.message}). ` +
              `Falling back to copy-link.`,
          );
        }
      } catch (mailErr) {
        logWarn(`Supabase invite email failed for ${email}:`, mailErr);
      }
    } else {
      // Forced-create path: admin sets the initial password directly.
      if (!data.password || data.password.length < 8) {
        throw new Error('A password of at least 8 characters is required');
      }
      const { data: authData, error: authError } = await adminAuthAdmin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name: data.name, role },
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create auth user');
      authUserId = authData.user.id;
    }

    // Insert the user into Prisma (Neon Database).
    const newUser = await prisma.user.create({
      data: {
        id: authUserId!,
        email,
        name: data.name,
        role,
        department: data.department || 'Unassigned',
        designation: data.designation || 'New Hire',
        managerId: data.managerId || null,
        branchId: data.branchId || null,
        employmentType: data.employmentType || 'Full-Time',
        joinDate,
        baseSalary,
        nid: nidRaw,
        nidMasked,
        status: accountStatus,
        isOnboarded: inviteMode ? false : false,
      },
    });

    // Fire a welcome automation if configured (best-effort, non-blocking).
    try {
      await runAutomationRules('employee.added', { userId: newUser.id, name: newUser.name, email }, caller);
    } catch (autoErr) {
      logError('Welcome automation failed (non-fatal):', autoErr);
    }

    return {
      success: true,
      user: newUser,
      inviteToken: inviteMode ? inviteToken : null,
      inviteMode,
    };
  } catch (error: any) {
    logError('Provisioning failed:', error);
    return { success: false, error: error.message };
  }
}

// Forward declaration satisfied at the bottom of this module to avoid a circular
// import at module-eval time. `db.ts` exports the automation runner.
async function runAutomationRules(
  trigger: string,
  ctx: Record<string, unknown>,
  caller: { id: string } | null
) {
  // Imported lazily to keep the server-action graph clean.
  const { runAutomationRules: run } = await import('@/app/actions/db');
  await run(trigger, ctx, caller);
}
