/**
 * Simple in-memory rate limiter.
 * Tracks request counts per IP and blocks when threshold is exceeded.
 * For multi-instance deployments, replace with Redis-based limiter.
 */

const ipMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipMap) {
    if (now > entry.resetAt) ipMap.delete(ip);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  maxRequests: number;   // max requests allowed
  windowMs: number;      // time window in milliseconds
  errorMessage?: string;
}

export function checkRateLimit(
  ip: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: now + options.windowMs };
  }

  entry.count++;

  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
}
