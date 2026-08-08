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

// Sensitve key pattern matcher
const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|bearer|nid|phone|email|creditcard|ssn/i;

/**
 * Recursively sanitizes any value or object to redact PII (emails, passwords, tokens, NIDs, phone numbers).
 */
export function sanitizePII<T>(val: T, depth = 0): T {
  if (depth > 5 || val === null || val === undefined) return val;

  if (typeof val === 'string') {
    // Redact email addresses
    let sanitized = val.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    // Redact bearer / JWT tokens
    sanitized = sanitized.replace(/bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');
    // Redact NID / SSN candidate sequences (10, 13, 17 digit strings)
    sanitized = sanitized.replace(/\b\d{10}\b|\b\d{13}\b|\b\d{17}\b/g, '[REDACTED_NID]');
    return sanitized as unknown as T;
  }

  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map((item) => sanitizePII(item, depth + 1)) as unknown as T;
    }

    if (val instanceof Error) {
      const copy = new Error(sanitizePII(val.message, depth + 1));
      copy.name = val.name;
      if (val.stack) copy.stack = sanitizePII(val.stack, depth + 1);
      return copy as unknown as T;
    }

    const obj = val as Record<string, unknown>;
    const sanitizedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.test(key)) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizePII(value, depth + 1);
      }
    }
    return sanitizedObj as unknown as T;
  }

  return val;
}

export function logError(message: string, error?: unknown, extra?: Record<string, unknown>) {
  const cleanMsg = sanitizePII(message);
  const cleanErr = sanitizePII(error);
  const cleanExtra = extra ? sanitizePII(extra) : undefined;

  if (isProd) {
    Sentry.captureException(cleanErr instanceof Error ? cleanErr : new Error(cleanMsg), {
      extra: { message: cleanMsg, ...cleanExtra },
    });
  } else if (cleanErr !== undefined) {
    console.error(cleanMsg, cleanErr);
  } else {
    console.error(cleanMsg);
  }
}

export function logWarn(message: string, error?: unknown) {
  const cleanMsg = sanitizePII(message);
  const cleanErr = sanitizePII(error);

  if (isProd) {
    Sentry.captureMessage(cleanMsg, 'warning');
  } else if (cleanErr !== undefined) {
    console.warn(cleanMsg, cleanErr);
  } else {
    console.warn(cleanMsg);
  }
}
