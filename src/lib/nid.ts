// ─────────────────────────────────────────────────────────────────────────────
// Bangladesh National ID (NID) helpers (Pillar 1b).
//
// BD NIDs are 10, 13, or 17 digits. We validate the format and produce a
// display-safe mask (e.g. "1990*****1234") so the full number is never shown in
// the UI.
//
// P1 — Encryption at rest: the raw NID is encrypted with AES-256-GCM before it
// is written to the `nid` column (the ciphertext is stored there as a base64
// string). `nidMasked` remains a plaintext display mask. Decryption
// (`decryptNid`) is only called in privileged server contexts that genuinely
// need the raw value; the UI renders `nidMasked`. Key source (in priority
// order): `INVITE_SECRET` → `NEXT_SUPABASE_SERVICE_ROLE_KEY` → dev fallback.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';

export type NidFormat = 'old' | 'new' | 'smart' | null;

// Prefix so we can tell ciphertext apart from legacy plaintext at read time.
const NID_CIPHER_PREFIX = 'nid:v1:';

function getNidKey(): Buffer {
  const secret =
    process.env.NID_ENCRYPTION_KEY ||
    process.env.INVITE_SECRET ||
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NID_ENCRYPTION_KEY must be set in production');
    }
    return crypto.createHash('sha256').update('insecure-dev-nid-key-change-me').digest();
  }
  return crypto.createHash('sha256').update(`ems-nid:${secret}`).digest();
}

/**
 * Encrypt a plaintext NID (digits only) with AES-256-GCM.
 * Returns `null` for empty input. Output format: `nid:v1:<iv>:<tag>:<ct>` (base64).
 */
export function encryptNid(plainDigits: string): string | null {
  const digits = plainDigits.replace(/\D/g, '');
  if (!digits) return null;
  const key = getNidKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(digits, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    NID_CIPHER_PREFIX +
    [iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':')
  );
}

/**
 * Decrypt a NID value. Accepts either our ciphertext (`nid:v1:...`) or, for
 * backwards compatibility with any legacy plaintext rows, returns the input
 * unchanged (after digit-stripping). Returns `null` if input is empty or the
 * ciphertext cannot be authenticated (tamper / wrong key).
 */
export function decryptNid(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(NID_CIPHER_PREFIX)) {
    // Legacy plaintext value (no prefix) — normalise to digits.
    const digits = stored.replace(/\D/g, '');
    return digits || null;
  }
  try {
    const [ivB64, tagB64, ctB64] = stored.slice(NID_CIPHER_PREFIX.length).split(':');
    const key = getNidKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    return pt.replace(/\D/g, '') || null;
  } catch {
    // Auth failure (tampered or key mismatch) — do NOT leak the raw bytes.
    return null;
  }
}

/** True if the stored `nid` column holds our ciphertext rather than plaintext. */
export function isEncryptedNid(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(NID_CIPHER_PREFIX);
}

/**
 * Validate a Bangladesh NID. Accepts 10 (old), 13 (new), or 17 (smart) digits.
 * Returns null if invalid.
 */
export function validateNid(raw: string): NidFormat {
  const digits = raw.replace(/\D/g, '');
  if (/^\d{10}$/.test(digits)) return 'old';
  if (/^\d{13}$/.test(digits)) return 'new';
  if (/^\d{17}$/.test(digits)) return 'smart';
  return null;
}

/**
 * Produce a display-safe mask. Shows the first 4 and last 4 digits, masks the
 * middle. For short NIDs we still keep at least the last 2 visible.
 */
export function maskNid(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  const head = digits.slice(0, 4);
  const tail = digits.slice(-4);
  const maskedLen = digits.length - 8;
  const middle = '*'.repeat(Math.max(4, maskedLen));
  return `${head}${middle}${tail}`;
}
