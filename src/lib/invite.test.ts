import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import {
  createInviteToken,
  verifyInviteToken,
} from './invite';

describe('invite tokens', () => {
  it('round-trips a valid token', () => {
    const token = createInviteToken('emp@example.com', 'Employee');
    const payload = verifyInviteToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.email).toBe('emp@example.com');
    expect(payload!.role).toBe('Employee');
  });

  it('rejects a tampered token', () => {
    const token = createInviteToken('emp@example.com', 'Employee');
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a');
    expect(verifyInviteToken(tampered)).toBeNull();
  });

  it('rejects an expired token', () => {
    // Craft a token with an already-passed expiry by manipulating the payload.
    const secret =
      process.env.INVITE_SECRET ||
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'insecure-dev-invite-secret-change-me';
    const body = Buffer.from(
      JSON.stringify({ email: 'x@y.z', role: 'Employee', exp: Date.now() - 1000 }),
    ).toString('base64url');
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    const expired = `${body}.${sig}`;
    expect(verifyInviteToken(expired)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifyInviteToken('not-a-token')).toBeNull();
    expect(verifyInviteToken('')).toBeNull();
  });
});
