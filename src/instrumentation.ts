import * as Sentry from '@sentry/nextjs';
import { validateEnv } from '@/lib/env';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnv();
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
  if (!dsn) {
    console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set — error monitoring is disabled.');
    return;
  }
  const sentryOptions: Sentry.NodeOptions = {
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      /^4\d\d$/,
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['set-cookie'];
        delete event.request.headers['x-supabase-auth'];
      }
      return event;
    },
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(sentryOptions);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(sentryOptions);
  }
}

export const onRequestError = Sentry.captureRequestError;
