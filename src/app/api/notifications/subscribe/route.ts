import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseApiBody, webPushSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseApiBody(req, webPushSchema);
    if ('res' in parsed) return parsed.res;
    const subscription = parsed.data.subscription as unknown;

    const updatedUser = await prisma.user.update({
      where: { id: caller.id },
      data: {
        pushSub: subscription as any,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logError('Subscribe Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

