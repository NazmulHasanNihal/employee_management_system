import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { requireCronSecret } from '@/lib/validation';

/**
 * GET /api/cron/backup-trigger
 *
 * Secure endpoint to trigger a database backup. This route is intended to be
 * called by Vercel Cron or an external cron job. It does NOT run pg_dump
 * directly (serverless functions cannot spawn child processes).
 *
 * Instead, it logs the trigger event. For actual backups, use one of:
 *   1. Supabase Dashboard → Project Settings → Database → Backups
 *   2. Run `scripts/backup-db.js` from a separate server/VPS with cron
 *   3. A Vercel Cron job that calls an external service running pg_dump
 *
 * Set CRON_SECRET in your environment.
 */
export async function GET(req: Request) {
  try {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const timestamp = new Date().toISOString();

    logError('Backup triggered via cron', new Error(`Backup triggered at ${timestamp}`));

    return NextResponse.json({
      ok: true,
      message: 'Backup trigger logged. Run scripts/backup-db.js on a server with pg_dump.',
      timestamp,
    });
  } catch (error) {
    logError('Backup trigger error:', error);
    return NextResponse.json(
      { ok: false, error: 'Backup trigger failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
