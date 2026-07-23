// ─────────────────────────────────────────────────────────────────────────────
// 2FA / TOTP helpers (P2 — security).
//
// Uses Node's built-in crypto for TOTP (RFC 6238). Secrets are stored encrypted
// at rest using the same AES-256-GCM pattern as NID encryption.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';

const TOTP_CIPHER_PREFIX = 'totp:v1:';
const TIME_STEP = 30;
const DIGITS = 6;

function getTotpKey(): Buffer {
  const secret =
    process.env.TOTP_ENCRYPTION_KEY ||
    process.env.NID_ENCRYPTION_KEY ||
    process.env.INVITE_SECRET ||
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TOTP_ENCRYPTION_KEY must be set in production');
    }
    return crypto.createHash('sha256').update('insecure-dev-totp-key-change-me').digest();
  }
  return crypto.createHash('sha256').update(`ems-totp:${secret}`).digest();
}

export function encryptSecret(plain: string): string {
  const key = getTotpKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return TOTP_CIPHER_PREFIX + [iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':');
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(TOTP_CIPHER_PREFIX)) {
    return stored;
  }
  try {
    const [ivB64, tagB64, ctB64] = stored.slice(TOTP_CIPHER_PREFIX.length).split(':');
    const key = getTotpKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    return pt;
  } catch {
    return null;
  }
}

export function generateSecret(): string {
  const raw = crypto.randomBytes(20).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return encryptSecret(raw);
}

export function generateTOTP(secretPlain: string): string {
  const key = Buffer.from(secretPlain.replace(/\s/g, ''), 'base64');
  const epoch = Math.floor(Date.now() / 1000);
  let counter = Math.floor(epoch / TIME_STEP);
  const counterBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 255;
    counter >>>= 8;
  }
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  const otp = binary % Math.pow(10, DIGITS);
  return otp.toString().padStart(DIGITS, '0');
}

export function verifyTOTP(storedSecret: string | null | undefined, token: string): boolean {
  const plain = decryptSecret(storedSecret);
  if (!plain) return false;
  const trimmed = token.trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  const current = generateTOTP(plain);
  if (current === trimmed) return true;
  const prevPlain = decryptSecret(storedSecret);
  if (!prevPlain) return false;
  const prevKey = Buffer.from(prevPlain.replace(/\s/g, ''), 'base64');
  const prevEpoch = Math.floor(Date.now() / 1000) - TIME_STEP;
  let prevCounter = Math.floor(prevEpoch / TIME_STEP);
  const prevCounterBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    prevCounterBuffer[i] = prevCounter & 255;
    prevCounter >>>= 8;
  }
  const prevHmac = crypto.createHmac('sha1', prevKey);
  prevHmac.update(prevCounterBuffer);
  const prevDigest = prevHmac.digest();
  const prevOffset = prevDigest[prevDigest.length - 1] & 0xf;
  const prevBinary =
    ((prevDigest[prevOffset] & 0x7f) << 24) |
    ((prevDigest[prevOffset + 1] & 0xff) << 16) |
    ((prevDigest[prevOffset + 2] & 0xff) << 8) |
    (prevDigest[prevOffset + 3] & 0xff);
  const prevOtp = prevBinary % Math.pow(10, DIGITS);
  return prevOtp.toString().padStart(DIGITS, '0') === trimmed;
}

export function getOtpAuthUri(secretPlain: string, email: string, issuer = 'OpsHub'): string {
  const clean = secretPlain.replace(/\s/g, '');
  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${clean}&issuer=${encodeURIComponent(issuer)}&digits=${DIGITS}&period=${TIME_STEP}`;
  return uri;
}

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const buf = crypto.randomBytes(5);
    const code = buf.toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-');
    codes.push(code);
  }
  return codes;
}
