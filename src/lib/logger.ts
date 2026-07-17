/**
 * Structured logger for server-side code.
 *
 * - In production, errors are reported to Sentry (with the message + any extra
 *   context) so failures are observable instead of lost in console noise.
 * - In development, we still log to the console for a fast local feedback loop.
 *
 * Usage:
 *   import { logError, logWarn } from '@/lib/logger';
 *   logError('Leave automation failed (non-fatal)', autoErr);
 */

import * as Sentry from '@sentry/nextjs';

const isProd = process.env.NODE_ENV === 'production';

export function logError(message: string, error?: unknown, extra?: Record<string, unknown>) {
  if (isProd) {
    Sentry.captureException(error instanceof Error ? error : new Error(message), {
      extra: { message, ...extra },
    });
  } else if (error !== undefined) {
    // eslint-disable-next-line no-console
    console.error(message, error);
  } else {
    // eslint-disable-next-line no-console
    console.error(message);
  }
}

export function logWarn(message: string, error?: unknown) {
  if (isProd) {
    Sentry.captureMessage(message, 'warning');
  } else if (error !== undefined) {
    // eslint-disable-next-line no-console
    console.warn(message, error);
  } else {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}
