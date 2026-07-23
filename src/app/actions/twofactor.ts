'use server';

import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { MutationError } from '@/lib/mutation-error';
import { generateSecret, getOtpAuthUri, generateBackupCodes, encryptSecret, decryptSecret } from '@/lib/twofactor';

export async function getTwoFactorStatus() {
  const caller = await getCaller();
  if (!caller) throw new MutationError('UNAUTHORIZED', 'Not authenticated');

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: { twoFactorEnabled: true },
  });

  return { enabled: user?.twoFactorEnabled ?? false };
}

export async function setupTwoFactor() {
  const caller = await getCaller();
  if (!caller) throw new MutationError('UNAUTHORIZED', 'Not authenticated');

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: { twoFactorEnabled: true, email: true },
  });

  if (!user) throw new MutationError('NOT_FOUND', 'User not found');
  if (user.twoFactorEnabled) {
    throw new MutationError('CONFLICT', '2FA is already enabled');
  }

  const secret = generateSecret();
  const plain = decryptSecret(secret);
  if (!plain) throw new MutationError('UNKNOWN', 'Failed to generate 2FA secret');

  const otpAuthUri = getOtpAuthUri(plain, user.email);

  await prisma.user.update({
    where: { id: caller.id },
    data: {
      twoFactorSecret: secret,
    },
  });

  return { secret: plain, otpAuthUri };
}

export async function enableTwoFactor(code: string) {
  const caller = await getCaller();
  if (!caller) throw new MutationError('UNAUTHORIZED', 'Not authenticated');

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorSecret) {
    throw new MutationError('CONFLICT', '2FA setup not found. Please start setup again.');
  }
  if (user.twoFactorEnabled) {
    throw new MutationError('CONFLICT', '2FA is already enabled');
  }

  const { verifyTOTP } = await import('@/lib/twofactor');
  if (!verifyTOTP(user.twoFactorSecret, code)) {
    throw new MutationError('VALIDATION', 'Invalid verification code');
  }

  await prisma.user.update({
    where: { id: caller.id },
    data: { twoFactorEnabled: true },
  });

  return { success: true };
}

export async function disableTwoFactor(code: string) {
  const caller = await getCaller();
  if (!caller) throw new MutationError('UNAUTHORIZED', 'Not authenticated');

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorEnabled) {
    throw new MutationError('CONFLICT', '2FA is not enabled');
  }

  const { verifyTOTP } = await import('@/lib/twofactor');
  if (!verifyTOTP(user.twoFactorSecret, code)) {
    throw new MutationError('VALIDATION', 'Invalid verification code');
  }

  await prisma.user.update({
    where: { id: caller.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { success: true };
}
