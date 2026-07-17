import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';



export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
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
