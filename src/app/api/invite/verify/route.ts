import { NextResponse } from 'next/server';
import { verifyInviteToken } from '@/lib/invite';
import { parseApiBody, tokenSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
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
