import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
    const { userId, title, body, url } = await req.json();

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
    console.error('Push Trigger Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
