import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Computes a SHA-256 hash for a given string
 */
export function computeSHA256Server(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Logs a secure audit event and enforces the cryptographic hash chain.
 * 
 * The hash for the new record is computed as:
 * SHA-256(previousHash + action + target + user + timestamp.toISOString())
 * 
 * This ensures that if any past record is tampered with, all subsequent hashes become invalid,
 * proving the integrity of the ledger.
 */
export async function logSecureAuditEvent(params: {
  action: string;
  target?: string;
  user: string;
  severity?: string;
}) {
  // Use a transaction to ensure we get the absolute latest record without race conditions
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the most recent audit log to get its hash
    const latestLog = await tx.auditLog.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    const previousHash = latestLog?.hash || 'genesis_hash_00000000000000000000000000000000';
    const timestamp = new Date();

    // 2. Compute the new hash
    const payloadString = previousHash + params.action + (params.target || '') + params.user + timestamp.toISOString();
    const hash = computeSHA256Server(payloadString);

    // 3. Save the chained log
    const newLog = await tx.auditLog.create({
      data: {
        action: params.action,
        target: params.target || null,
        user: params.user,
        severity: params.severity || 'INFO',
        timestamp,
        previousHash,
        hash,
      },
    });

    return newLog;
  });
}
