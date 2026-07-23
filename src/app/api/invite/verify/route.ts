import { NextResponse } from 'next/server';
import { verifyInviteToken } from '@/lib/invite';
import { parseApiBody, tokenSchema } from '@/lib/validation';
import { rateLimit, provisionKey } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimit(provisionKey(undefined, ip), { max: 20, windowMs: 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const parsed = await parseApiBody(req, tokenSchema);
    if ('res' in parsed) return parsed.res;
    const { token } = parsed.data;
    const payload = verifyInviteToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invite link is invalid or has expired.' }, { status: 401 });
    }
    return NextResponse.json({ email: payload.email, role: payload.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
