import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { requireCronSecret } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/backup-verify
 *
 * Lightweight health-check that verifies database connectivity and basic
 * application readiness. Run via Vercel Cron (or similar) to catch
 * connectivity or schema regressions before they affect users.
 *
 * Configure in vercel.json:
 *   {
 *     "crons": [
 *       { "path": "/api/cron/backup-verify", "schedule": "0 6 * * *" }
 *     ]
 *   }
 *
 * Set CRON_SECRET in your environment.
 */
export async function GET(req: Request) {
  try {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const started = Date.now();
    const [userCount, notificationCount] = await Promise.all([
      prisma.user.count(),
      prisma.notification.count(),
    ]);
    const latencyMs = Date.now() - started;

    const checks = {
      database: 'ok',
      latencyMs,
      userCount,
      notificationCount,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, checks });
  } catch (error) {
    logError('Backup verification cron error:', error);
    return NextResponse.json(
      { ok: false, error: 'Database health check failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
