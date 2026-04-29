// Tiny in-process sliding-window rate limiter. Per-key bucket of timestamps;
// trims expired entries on each call. Sufficient for a single-VM deployment;
// would need Redis if we ever scaled out.

type Bucket = number[];
const buckets = new Map<string, Bucket>();

export type RateResult = { ok: boolean; remaining: number; resetSec: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  let b = buckets.get(key);
  if (!b) { b = []; buckets.set(key, b); }
  // Drop expired
  while (b.length && b[0] < cutoff) b.shift();
  if (b.length >= limit) {
    return { ok: false, remaining: 0, resetSec: Math.ceil((b[0] + windowMs - now) / 1000) };
  }
  b.push(now);
  return { ok: true, remaining: limit - b.length, resetSec: Math.ceil(windowMs / 1000) };
}

// Periodically reap empty buckets so the map doesn't grow unbounded.
let lastReap = 0;
export function reapIfDue() {
  const now = Date.now();
  if (now - lastReap < 60_000) return;
  lastReap = now;
  for (const [k, b] of buckets) {
    if (b.length === 0) buckets.delete(k);
  }
}

export function clientIp(req: Request, trusted = process.env.TRUSTED_PROXY === '1'): string {
  const h = req.headers;
  if (trusted) {
    const xff = h.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
  }
  return h.get('x-real-ip') || 'unknown';
}
