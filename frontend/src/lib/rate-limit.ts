interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  options: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetIn: options.windowMs,
    };
  }

  entry.count++;
  const remaining = Math.max(0, options.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  return {
    allowed: entry.count <= options.maxRequests,
    remaining,
    resetIn,
  };
}

export function rateLimitByIp(
  ip: string,
  options: { maxRequests?: number; windowMs?: number } = {}
) {
  return rateLimit(`ip:${ip}`, {
    maxRequests: options.maxRequests ?? 30,
    windowMs: options.windowMs ?? 60_000,
  });
}
