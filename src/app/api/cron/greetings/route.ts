import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { requireCronSecret } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

/**
 * GET /api/cron/greetings
 *
 * Idempotent daily engagement-greeting runner (P10). Triggered by an external
 * cron (e.g. Vercel Cron) or manually with a CRON_SECRET header. For today's
 * date it derives:
 *   - Birthdays:    active users whose dateOfBirth matches today
 *   - Anniversaries: active users whose joinDate matches today (tenure years)
 *   - Festivals:    holidays today of type Festival/Religious/National
 *
 * For each, it creates an in-app Notification (type 'engagement') + optional
 * web-push, and a GreetingLog row (unique per kind+user+today for idempotency).
 */
export async function GET(req: Request) {
  try {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const rules = await prisma.greetingRule.findMany({ where: { isActive: true } });
    const ruleFor = (kind: string) => rules.find((r) => r.kind === kind);
    const birthdayRule = ruleFor('birthday');
    const anniversaryRule = ruleFor('anniversary');
    const festivalRule = ruleFor('festival');

    const summary = { birthdays: 0, anniversaries: 0, festivals: 0 };

    // ── Birthdays ──
    if (birthdayRule) {
      const users = await prisma.user.findMany({
        where: { status: 'active', dateOfBirth: { not: null } },
        select: { id: true, name: true, dateOfBirth: true, pushSub: true },
      });
      for (const u of users) {
        if (!u.dateOfBirth) continue;
        const dob = new Date(u.dateOfBirth);
        if (dob.getMonth() !== now.getMonth() || dob.getDate() !== now.getDate()) continue;
        const msg = birthdayRule.messageTemplate.replace('{name}', u.name);
        await sendGreeting('birthday', u.id, u.name, msg, u.pushSub as any);
        summary.birthdays++;
      }
    }

    // ── Anniversaries ──
    if (anniversaryRule) {
      const users = await prisma.user.findMany({
        where: { status: 'active', joinDate: { not: null } },
        select: { id: true, name: true, joinDate: true, pushSub: true },
      });
      for (const u of users) {
        if (!u.joinDate) continue;
        const jd = new Date(u.joinDate);
        if (jd.getMonth() !== now.getMonth() || jd.getDate() !== now.getDate()) continue;
        const years = now.getFullYear() - jd.getFullYear();
        const msg = anniversaryRule.messageTemplate.replace('{name}', u.name).replace('{years}', String(years));
        await sendGreeting('anniversary', u.id, u.name, msg, u.pushSub as any);
        summary.anniversaries++;
      }
    }

    // ── Festivals ──
    if (festivalRule) {
      const holidays = await prisma.holiday.findMany({
        where: { date: { gte: startOfDay, lt: endOfDay }, type: { in: ['Festival', 'Religious', 'National'] } },
      });
      for (const h of holidays) {
        const users = await prisma.user.findMany({ where: { status: 'active' }, select: { id: true, name: true, pushSub: true } });
        const msg = festivalRule.messageTemplate.replace('{holiday}', h.name);
        for (const u of users) {
          await sendGreeting('festival', u.id, u.name, msg, u.pushSub as any);
        }
        summary.festivals++;
      }
    }

    return NextResponse.json({ ok: true, date: now.toISOString(), summary });
  } catch (error: any) {
    logError('Greeting cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendGreeting(kind: string, userId: string | null, userName: string, message: string, pushSub: any) {
  // Idempotency: one greeting per kind+user per day.
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const existing = await prisma.greetingLog.findFirst({
    where: { kind, userId: userId ?? undefined, sentAt: { gte: dayStart } },
  });
  if (existing) return;

  const link = kind === 'festival' ? '/calendar' : '/engagement';

  if (userId) {
    await prisma.notification.create({
      data: { userId, type: 'engagement', message, link },
    });
  }

  if (pushSub && process.env.VAPID_PRIVATE_KEY) {
    try {
      await webpush.sendNotification(pushSub, JSON.stringify({ title: 'EMS Greetings', body: message, url: link }));
    } catch {
      // Ignore push failures (expired sub etc.) — in-app notification still created.
    }
  }

  await prisma.greetingLog.create({
    data: { kind, userId: userId ?? null, message, sentAt: new Date() },
  });
}
