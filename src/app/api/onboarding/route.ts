import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { maskNid, validateNid, encryptNid } from '@/lib/nid';
import { parseApiBody, nidOnboardingSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) {
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
      where: { id: caller.id },
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
        actorId: caller.id,
        targetId: caller.id,
        details: { onboarded: true, hasNid: !!nidRaw },
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    logError('Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
