'use server';

import crypto from 'crypto';
import { rateLimit, provisionKey } from '@/lib/ratelimit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { MutationError } from '@/lib/mutation-error';
import { verifyTOTP, decryptSecret } from '@/lib/twofactor';

interface PendingSession {
  email: string;
  password: string;
  expires: number;
}

const pendingSessions = new Map<string, PendingSession>();

function cleanupPendingSessions() {
  const now = Date.now();
  for (const [key, session] of pendingSessions) {
    if (session.expires < now) {
      pendingSessions.delete(key);
    }
  }
}

export async function loginWithRateLimit(email: string, password: string, twoFactorCode?: string, tempSessionId?: string) {
  const ip = 'unknown';
  const rl = await rateLimit(provisionKey(undefined, ip), { max: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return { error: 'Too many login attempts. Try again in 15 minutes.' };
  }

  const admin = createAdminClient();

  if (twoFactorCode) {
    if (!tempSessionId) {
      return { error: 'Invalid 2FA session. Please log in again.' };
    }
    const session = pendingSessions.get(tempSessionId);
    if (!session || session.expires < Date.now()) {
      pendingSessions.delete(tempSessionId);
      return { error: 'Session expired. Please log in again.' };
    }

    const { data, error } = await admin.auth.signInWithPassword({
      email: session.email,
      password: session.password,
    });

    if (error) {
      logError('2FA login failed:', error);
      return { error: error.message || 'Invalid credentials' };
    }

    const user = await prisma.user.findUnique({ where: { id: data.user.id } });
    if (!user || !user.twoFactorEnabled) {
      return { error: '2FA is not enabled for this account' };
    }

    const isValid = verifyTOTP(user.twoFactorSecret, twoFactorCode);
    if (!isValid) {
      return { error: 'Invalid verification code' };
    }

    pendingSessions.delete(tempSessionId);
    
    // 2FA passed. Now log in with server client to set cookies.
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: session.email,
      password: session.password,
    });
    
    if (authError) return { error: authError.message };
    return { user: authData.user };
  }

  const { data, error } = await admin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logError('Login failed:', error);
    return { error: error.message || 'Invalid credentials' };
  }

  const user = await prisma.user.findUnique({ where: { id: data.user.id } });
  if (!user) {
    return { error: 'User not found' };
  }

  if (user.twoFactorEnabled) {
    const sessionId = crypto.randomUUID();
    pendingSessions.set(sessionId, {
      email,
      password,
      expires: Date.now() + 120000,
    });
    cleanupPendingSessions();
    return { requiresTwoFactor: true, sessionId };
  }

  // No 2FA required. Sign in with Server Client to set cookies.
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (authError) return { error: authError.message };
  return { user: authData.user };
}

export async function sendMagicLink(email: string) {
  const ip = 'unknown';
  const rl = await rateLimit(provisionKey(undefined, ip), { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return { error: 'Too many attempts. Try again in 15 minutes.' };
  }

  const supabase = await createClient();
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Don't allow random signups
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    logError('Magic link failed:', error);
    return { error: error.message };
  }

  return { ok: true };
}

export async function updatePassword(password: string) {
  const ip = 'unknown';
  const rl = await rateLimit(provisionKey(undefined, ip), { max: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return { error: 'Too many attempts. Try again in 15 minutes.' };
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    logError('Update password failed:', error);
    return { error: error.message || 'Failed to update password' };
  }

  return { success: true };
}
