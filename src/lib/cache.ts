type CacheEntry<T> = { data: T; expiry: number };

const caches = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = caches.get(key);
  if (entry && entry.expiry > now) return Promise.resolve(entry.data as T);
  return fetcher().then(data => {
    caches.set(key, { data, expiry: now + ttlMs });
    // Evict expired entries periodically
    if (caches.size > 200) {
      for (const [k, v] of caches) {
        if (v.expiry <= now) caches.delete(k);
      }
    }
    return data;
  });
}

export function cacheResponse(data: unknown, ttlSeconds: number): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
    },
  });
}
