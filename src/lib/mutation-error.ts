/**
 * Typed error contract for the mutation router (src/app/actions/db.ts).
 *
 * Kept in its own non-"use server" module so it can export a class/helper
 * without violating Next.js's "use server" rule (only async functions may be
 * exported from a server-action file).
 */

export class MutationError extends Error {
  code: 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMIT' | 'AUTH_FAILED' | 'UNKNOWN';
  cause?: unknown;
  constructor(
    code: MutationError['code'],
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'MutationError';
    this.code = code;
    this.cause = cause;
  }
}

export function classifyError(error: unknown): MutationError {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  if (/Unauthorized|not have permission|admins only/i.test(message)) {
    return new MutationError('UNAUTHORIZED', message, error);
  }
  if (/Invalid|required|must be|expected/i.test(message)) {
    return new MutationError('VALIDATION', message, error);
  }
  if (/not found|does not exist/i.test(message)) {
    return new MutationError('NOT_FOUND', message, error);
  }
  if (/already|conflict|unique/i.test(message)) {
    return new MutationError('CONFLICT', message, error);
  }
  return new MutationError('UNKNOWN', message, error);
}
