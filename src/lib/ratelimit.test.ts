import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, provisionKey } from './ratelimit';

describe('rate limiter (in-memory)', () => {
  beforeEach(() => {
    // Isolate from any Redis config in the environment so we exercise the
    // in-memory path deterministically.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('allows up to the limit, then blocks', async () => {
    const key = `test:${Math.random()}`;
    const max = 3;
    const first = await rateLimit(key, { max, windowMs: 60_000 });
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(max - 1);

    await rateLimit(key, { max, windowMs: 60_000 });
    const third = await rateLimit(key, { max, windowMs: 60_000 });
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await rateLimit(key, { max, windowMs: 60_000 });
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it('builds a stable per-actor provision key', () => {
    expect(provisionKey('admin-1', null)).toBe('ratelimit:provision:admin-1');
    expect(provisionKey(undefined, '1.2.3.4')).toBe('ratelimit:provision:1.2.3.4');
    expect(provisionKey(undefined, null)).toBe('ratelimit:provision:anonymous');
  });
});
