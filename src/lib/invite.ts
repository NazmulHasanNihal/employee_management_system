// ─────────────────────────────────────────────────────────────────────────────
// Signed invite tokens for the employee invitation flow (Pillar 1a).
//
// A "Provision" action mints a signed token (HMAC) carrying the invitee's email
// and intended role. The employee opens /invite/[token], sets their own
// password, and is then routed into the onboarding flow. This avoids the admin
// ever handling the employee's plaintext password.
//
// Signing uses INVITE_SECRET (falling back to the Supabase service-role key so
// it works out of the box). Tokens are stateless and expire after INVITE_TTL_MS.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';

export interface InvitePayload {
  email: string;
  role: string;
  exp: number; // unix ms
}

const INVITE_TTL_MS = 1000 * 60 * 60 * 72; // 72 hours

function getSecret(): string {
  const secret =
    process.env.INVITE_SECRET ||
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    // Should never happen in a configured deployment, but avoid crashing.
    return 'insecure-dev-invite-secret-change-me';
  }
  return secret;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
}

export function createInviteToken(email: string, role: string): string {
  const payload: InvitePayload = {
    email,
    role,
    exp: Date.now() + INVITE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyInviteToken(token: string): InvitePayload | null {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = sign(body);
    // Constant-time compare to avoid timing attacks.
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as InvitePayload;
    if (!payload.email || !payload.role) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
