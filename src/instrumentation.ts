import * as Sentry from '@sentry/nextjs';

export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "https://mock@o0.ingest.sentry.io/0";
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn(
      '[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set — errors will be sent to a mock endpoint and dropped. ' +
      'Set a real DSN in .env to receive error alerts.'
    );
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
