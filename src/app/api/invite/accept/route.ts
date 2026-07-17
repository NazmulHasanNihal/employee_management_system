import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { verifyInviteToken } from '@/lib/invite';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { parseApiBody, inviteAcceptSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const parsed = await parseApiBody(req, inviteAcceptSchema);
    if ('res' in parsed) return parsed.res;
    const { token, password } = parsed.data;

    const payload = verifyInviteToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invite link is invalid or has expired.' }, { status: 401 });
    }

    // Resolve the Prisma user to obtain the Supabase auth id.
    const dbUser = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'No matching account for this invite.' }, { status: 404 });
    }

    // Set the password using the admin client (service role).
    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(dbUser.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Activate the account and route them into onboarding.
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { status: 'active', isOnboarded: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logError('Invite accept failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
