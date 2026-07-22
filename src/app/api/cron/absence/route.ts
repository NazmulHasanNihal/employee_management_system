import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { requireCronSecret } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/absence
 *
 * Marks employees "Absent" who had a shift assignment on the target day but no
 * attendance (punch) record. Previously absence was only *derived* for display;
 * this endpoint writes an explicit `Absent` Attendance row so reporting and
 * payroll can rely on persisted data (P2 — resilience).
 *
 * Trigger: external cron (e.g. Vercel Cron) or manually with a CRON_SECRET
 * header/bearer. Idempotent: it never overwrites an existing attendance row.
 *
 * Query params:
 *   - `date` (optional, YYYY-MM-DD): the day to reconcile. Defaults to yesterday
 *     (the usual "after shift-end" run).
 *   - `dryRun` (optional, "1"/"true"): count what *would* be marked absent
 *     without writing.
 */
export async function GET(req: Request) {
  try {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dryRun') === 'true';

    const day = dateParam ? new Date(`${dateParam}T00:00:00`) : (() => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return y;
    })();
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

    // All shift assignments for the target day.
    const assignments = await prisma.shiftAssignment.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      include: { user: { select: { id: true, status: true } } },
    });

    // Existing attendance for those users on that day (for idempotency).
    const userIds = Array.from(new Set(assignments.map((a) => a.userId)));
    const existing = await prisma.attendance.findMany({
      where: { userId: { in: userIds }, date: { gte: dayStart, lt: dayEnd } },
      select: { userId: true },
    });
    const covered = new Set(existing.map((e) => e.userId));

    // Employees with an assignment but no attendance record => Absent.
    const absentUserIds = assignments
      .filter((a) => !covered.has(a.userId) && a.user?.status !== 'Offboarded')
      .map((a) => a.userId);

    const uniqueAbsent = Array.from(new Set(absentUserIds));

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        date: dayStart.toISOString(),
        wouldMarkAbsent: uniqueAbsent.length,
        userIds: uniqueAbsent,
      });
    }

    let created = 0;
    for (const userId of uniqueAbsent) {
      await prisma.attendance.create({
        data: {
          userId,
          date: dayStart,
          status: 'Absent',
          // No clock times; shift context is intentionally omitted to keep the
          // auto-marked row simple and auditable.
        },
      });
      created++;
    }

    return NextResponse.json({
      ok: true,
      date: dayStart.toISOString(),
      markedAbsent: created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logError('Absence cron error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
