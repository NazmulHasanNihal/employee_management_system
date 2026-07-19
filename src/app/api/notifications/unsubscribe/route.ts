import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: caller.id },
      data: {
        pushSub: null, // Clear subscription
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    logError('Unsubscribe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

