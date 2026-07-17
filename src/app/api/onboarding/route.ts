import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { maskNid, validateNid, encryptNid } from '@/lib/nid';
import { parseApiBody, nidOnboardingSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseApiBody(req, nidOnboardingSchema);
    if ('res' in parsed) return parsed.res;
    const body = parsed.data;

    // Validate the NID if provided (store masked for display).
    let nidRaw: string | null = null;
    let nidMasked: string | null = null;
    if (body.nid) {
      const fmt = validateNid(String(body.nid));
      if (!fmt) {
        return NextResponse.json({ error: 'Invalid National ID' }, { status: 400 });
      }
      nidRaw = String(body.nid).replace(/\D/g, '');
      nidMasked = maskNid(nidRaw);
      // Encrypt at rest: store ciphertext in `nid`, keep mask for display.
      nidRaw = encryptNid(nidRaw) ?? nidRaw;
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        isOnboarded: true,
        name: body.name ? String(body.name) : undefined,
        phone: body.phone ?? undefined,
        nid: nidRaw,
        nidMasked,
        bloodGroup: body.bloodGroup ?? undefined,
        gender: body.gender ?? undefined,
        address: body.address ?? undefined,
        emergencyContactName: body.emergencyContactName ?? undefined,
        emergencyContactPhone: body.emergencyContactPhone ?? undefined,
        ...(body.avatarUrl && { avatarUrl: body.avatarUrl }),
      },
    });

    await prisma.event.create({
      data: {
        action: 'USER_ONBOARDED',
        actorId: authUser.id,
        targetId: authUser.id,
        details: { onboarded: true, hasNid: !!nidRaw },
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    logError('Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
