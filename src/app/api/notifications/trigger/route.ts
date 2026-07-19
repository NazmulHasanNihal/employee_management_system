import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';
import { parseApiBody, notifySchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    // ── Auth + authorization gate ──
    // Only an authenticated Admin/HR/CEO may trigger a push to another user.
    const caller = await getCaller();
    if (!caller || !(caller.isAdmin || caller.isHR || caller.isCEO || caller.isOwner)) {
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
