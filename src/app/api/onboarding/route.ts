import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        isOnboarded: true,
        ...(body.avatarUrl && { avatarUrl: body.avatarUrl }),
      },
    });

    await prisma.event.create({
      data: {
        action: 'USER_ONBOARDED',
        actorId: authUser.id,
        targetId: authUser.id,
        details: body,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
