// ─────────────────────────────────────────────────────────────────────────────
// Edge type-safety helpers (Foundations: "Type Safety on Edges").
//
// Every untrusted input in this app enters through one of two choke points:
//   1. `/api/*` route handlers (raw `Request` bodies from the network).
//   2. Server actions `executeServerQuery` / `executeServerMutation` (args
//      serialized over the Next.js server-action boundary).
//
// We centralise Zod-based validation so a malformed payload fails fast with a
// 400 at the boundary instead of crashing deep inside a Prisma query or, worse,
// producing a silently-wrong payroll number. Route handlers pass a per-route
// schema; server actions validate the envelope (path string + object args).
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { NextResponse } from 'next/server';

/** Envelope for server-action calls: a dotted path + an optional object arg. */
export const ServerActionArgsSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_.]+$/, 'path must be a dotted identifier'),
  args: z.unknown().optional(),
});

export type ServerActionArgs = z.infer<typeof ServerActionArgsSchema>;

/**
 * Guard a CRON/webhook route. The endpoint must be called with a shared secret
 * (`Authorization: Bearer <CRON_SECRET>` or `x-cron-secret` header).
 *
 * Security model:
 *  - If `CRON_SECRET` IS configured, the request must present it — fail closed.
 *  - If `CRON_SECRET` is NOT configured: this is fine for local/dev, but in a
 *    production deployment it means the endpoint is unauthenticated. Fail
 *    closed there (return a 500 with guidance) so a missing secret can never
 *    silently expose a world-callable, mutating cron endpoint.
 *
 * Returns `null` when authorized (caller may proceed) or a `NextResponse`
 * (the caller should `return` it) when unauthorized.
 */
export function requireCronSecret(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const authHeader =
    req.headers.get('authorization') || req.headers.get('x-cron-secret');

  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
  }

  // No secret configured.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Server misconfiguration: CRON_SECRET is not set' },
      { status: 500 },
    );
  }
  return null;
}

/** Envelope for batched queries: an array of `{ path, args }` pairs. */
export const BatchSchema = z
  .array(
    z.object({
      path: ServerActionArgsSchema.shape.path,
      args: z.unknown().optional(),
    }),
  )
  .min(1)
  .max(25);

/**
 * Validate a server-action envelope. Returns the parsed result or throws a
 * `ValidationError` carrying a 400-friendly message. Callers wrap this in their
 * existing try/catch so the existing error shape is preserved.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function parseServerAction(path: unknown, args: unknown): ServerActionArgs {
  const result = ServerActionArgsSchema.safeParse({ path, args });
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid server action args');
  }
  return result.data;
}

/**
 * Validate a raw API request body against a Zod schema and return the parsed
 * value. On failure, returns a `NextResponse` you can early-return from the
 * route (status 400) — keeps route handlers terse and consistent.
 */
export async function parseApiBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { res: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { res: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      res: NextResponse.json(
        { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: result.data };
}

// ── Reusable primitives for route schemas ──
export const tokenSchema = z.object({ token: z.string().trim().min(10).max(2000) });
export const passwordSchema = z
  .object({ password: z.string().min(8).max(200) })
  .strict();
export const inviteAcceptSchema = tokenSchema.merge(passwordSchema);
// pushSub is stored as raw JSON in the DB; we only require it to be present
// and minimally-shaped. The route casts to Prisma's JSON input type.
export const webPushSchema = z.object({
  subscription: z.object({ endpoint: z.string().url() }).passthrough(),
});
export const nidOnboardingSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    phone: z.string().max(30).optional(),
    nid: z.string().max(20).optional(),
    bloodGroup: z.string().max(10).optional(),
    gender: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    emergencyContactName: z.string().max(200).optional(),
    emergencyContactPhone: z.string().max(30).optional(),
    avatarUrl: z.string().url().optional(),
    password: z.string().min(8).optional(),
  })
  .passthrough();
export const notifySchema = z.object({
  userId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  url: z.string().max(500).optional(),
});
