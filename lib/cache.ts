/**
 * Simple in-memory cache with TTL.
 *
 * Use case: caching database queries that are read often but written rarely.
 *   getSiteSettings()      → cache 60s (changed via admin settings page)
 *   getPublishedProducts() → cache 60s (changed via admin product page)
 *
 * Cache is automatically invalidated when the admin saves changes
 * via the `revalidateTag()` call in admin API routes.
 *
 * For multi-instance deployments, replace with Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000; // 60 seconds

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

/**
 * Delete all cache entries that match a prefix.
 * Example: cacheDeletePrefix("products:") removes all cached product queries.
 */
export function cacheDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Clear entire cache (use for emergencies only).
 */
export function cacheClear(): void {
  store.clear();
}
