import { describe, it, expect } from 'vitest';
import { generateTOTP, verifyTOTP, encryptSecret, decryptSecret, generateSecret, getOtpAuthUri } from '@/lib/twofactor';

describe('twofactor', () => {
  it('generates a 6-digit TOTP', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = generateTOTP(secret);
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('verifies current TOTP', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = generateTOTP(secret);
    expect(verifyTOTP(encryptSecret(secret), code)).toBe(true);
  });

  it('rejects invalid TOTP', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(verifyTOTP(encryptSecret(secret), '000000')).toBe(false);
  });

  it('rejects non-numeric TOTP', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(verifyTOTP(encryptSecret(secret), 'ABCDEF')).toBe(false);
  });

  it('encrypts and decrypts secrets', () => {
    const plain = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toBe(plain);
    expect(encrypted.startsWith('totp:v1:')).toBe(true);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('generates a valid otpauth URI', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = getOtpAuthUri(secret, 'user@example.com');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('user%40example.com');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
  });

  it('generateSecret produces encrypted output', () => {
    const secret = generateSecret();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(0);
  });
});
