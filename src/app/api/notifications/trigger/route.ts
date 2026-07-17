import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { parseApiBody, notifySchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    // ── Auth + authorization gate ──
    // Only an authenticated Admin/HR/CEO may trigger a push to another user.
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({ where: { id: authUser.id } });
    const isPrivileged =
      caller?.role === 'Admin' ||
      caller?.role === 'HR Manager' ||
      caller?.role === 'CEO' ||
      caller?.isOwner;

    if (!isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
    const parsed = await parseApiBody(req, notifySchema);
    if ('res' in parsed) return parsed.res;
    const { userId, title, body, url } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.pushSub) {
      return NextResponse.json({ error: 'User or subscription not found' }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body, url });
    
    await webpush.sendNotification(user.pushSub as any, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logError('Push Trigger Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
