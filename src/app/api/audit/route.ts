import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request) {
  try {
    const caller = await getCaller();
    if (!caller || !caller.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logError('Audit Fetch Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

