/**
 * Typed error contract for the mutation router (src/app/actions/db.ts).
 *
 * Kept in its own non-"use server" module so it can export a class/helper
 * without violating Next.js's "use server" rule (only async functions may be
 * exported from a server-action file).
 */

export class MutationError extends Error {
  code: 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNKNOWN';
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

export function classifyError(error: any): MutationError {
  const msg = String(error?.message ?? error ?? 'Unknown error');
  if (/Unauthorized|not have permission|admins only/i.test(msg)) {
    return new MutationError('UNAUTHORIZED', msg, error);
  }
  if (/Invalid|required|must be|expected/i.test(msg)) {
    return new MutationError('VALIDATION', msg, error);
  }
  if (/not found|does not exist/i.test(msg)) {
    return new MutationError('NOT_FOUND', msg, error);
  }
  if (/already|conflict|unique/i.test(msg)) {
    return new MutationError('CONFLICT', msg, error);
  }
  return new MutationError('UNKNOWN', msg, error);
}
