import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!dbUser || (dbUser.role !== 'Admin' && dbUser.role !== 'HR Manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Audit Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
