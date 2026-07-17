import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  validateNid,
  maskNid,
  encryptNid,
  decryptNid,
  isEncryptedNid,
} from './nid';

// Pin the encryption key for hermetic tests regardless of whether the test
// runner loads project .env files (which can make env lookups inconsistent
// across bundler transforms).
const ORIG_ENV = process.env.INVITE_SECRET;
beforeAll(() => {
  process.env.INVITE_SECRET = 'unit-test-nid-secret';
});
afterAll(() => {
  if (ORIG_ENV === undefined) delete process.env.INVITE_SECRET;
  else process.env.INVITE_SECRET = ORIG_ENV;
});

describe('NID validation', () => {
  it('accepts 10, 13, 17-digit NIDs', () => {
    expect(validateNid('1234567890')).toBe('old');
    expect(validateNid('1234567890123')).toBe('new');
    expect(validateNid('12345678901234567')).toBe('smart');
  });
  it('rejects invalid lengths', () => {
    expect(validateNid('123')).toBeNull();
    expect(validateNid('12345678901')).toBeNull();
    expect(validateNid('abcd')).toBeNull();
  });
});

describe('NID masking', () => {
  it('masks head and tail, hides the middle', () => {
    const masked = maskNid('1990123456789');
    expect(masked.startsWith('1990')).toBe(true);
    expect(masked.endsWith('6789')).toBe(true);
    // middle is fully masked with '*'
    expect(masked.slice(4, -4)).toMatch(/^\*+$/);
  });
});

describe('NID encryption at rest (AES-256-GCM)', () => {
  it('encrypts and decrypts round-trip', () => {
    const plain = '1234567890123';
    const ct = encryptNid(plain);
    expect(ct).not.toBeNull();
    expect(ct).not.toContain(plain);
    expect(isEncryptedNid(ct)).toBe(true);
    expect(decryptNid(ct)).toBe(plain);
  });

  it('strips non-digits before encrypting', () => {
    const ct = encryptNid('1234-5678-9012-3');
    expect(decryptNid(ct)).toBe('1234567890123');
  });

  it('returns null for empty input', () => {
    expect(encryptNid('')).toBeNull();
    expect(decryptNid(null)).toBeNull();
  });

  it('falls back to digit-stripped plaintext for legacy rows', () => {
    expect(decryptNid('1234567890')).toBe('1234567890');
    expect(isEncryptedNid('1234567890')).toBe(false);
  });

  it('returns null on tampered ciphertext (auth failure)', () => {
    const ct = encryptNid('1234567890123')!;
    // Flip a character inside the ciphertext segment (the part after the 2nd
    // colon) so GCM authentication reliably fails.
    const [, , ctSeg] = ct.split(':');
    const flipped = ctSeg.slice(0, -1) + (ctSeg.endsWith('A') ? 'B' : 'A');
    const tampered = ct.replace(ctSeg, flipped);
    expect(decryptNid(tampered)).toBeNull();
  });
});
