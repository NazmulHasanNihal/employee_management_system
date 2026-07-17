// ─────────────────────────────────────────────────────────────────────────────
// Lightweight rate limiter (P2 — resilience).
//
// Used to throttle provisioning/invite endpoints so a compromised admin session
// or a buggy client can't spam account creation. Two backends:
//   - Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
//     (works across serverless instances — preferred in production).
//   - In-memory sliding window otherwise (single-instance dev / CI only; note it
//     does NOT share state across horizontally-scaled servers).
// ─────────────────────────────────────────────────────────────────────────────

interface LimitResult {
  success: boolean;
  remaining: number;
  resetMs: number; // epoch ms when the window resets
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 20; // generous for admins, tight enough to blunt abuse

// In-memory store: key -> { count, reset }
const mem = new Map<string, { count: number; reset: number }>();

function memLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  const entry = mem.get(key);
  if (!entry || now > entry.reset) {
    mem.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: max - 1, resetMs: now + windowMs };
  }
  if (entry.count >= max) {
    return { success: false, remaining: 0, resetMs: entry.reset };
  }
  entry.count += 1;
  return { success: true, remaining: max - entry.count, resetMs: entry.reset };
}

async function redisLimit(key: string, max: number, windowMs: number): Promise<LimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return memLimit(key, max, windowMs);

  // INCR + PEXPIRE via Upstash REST. One round-trip with a Lua-style pipeline
  // isn't available over plain REST, so we do INCR then set expiry if new.
  const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const { result: count } = (await res.json()) as { result: number };
  if (count === 1) {
    await fetch(`${url}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  const resetMs = Date.now() + windowMs;
  return { success: count <= max, remaining: Math.max(0, max - count), resetMs };
}

/**
 * Check (and increment) a rate limit for `key`. Returns whether the request is
 * allowed plus the remaining quota and reset time.
 */
export async function rateLimit(
  key: string,
  opts: { max?: number; windowMs?: number } = {},
): Promise<LimitResult> {
  const max = opts.max ?? MAX_PER_WINDOW;
  const windowMs = opts.windowMs ?? WINDOW_MS;
  return redisLimit(key, max, windowMs);
}

/** Build a stable per-actor key for the invite/provision endpoint. */
export function provisionKey(actorId: string | undefined, ip: string | null): string {
  return `ratelimit:provision:${actorId || ip || 'anonymous'}`;
}
