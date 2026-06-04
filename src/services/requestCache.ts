import { resolveApiBaseUrl } from '../config/apiBaseUrl';

/** In-flight dedupe + short TTL memory cache for GET JSON (Phase 2). */
const inflight = new Map<string, Promise<unknown>>();
const memory = new Map<string, { data: unknown; expires: number }>();

let perfScreen = 'app';

export function setPerformanceScreen(name: string): void {
  perfScreen = name;
}

export function buildCacheKey(method: string, url: string): string {
  try {
    const base = resolveApiBaseUrl();
    const resolved = url.startsWith('http') ? url : `${base.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
    const u = new URL(resolved);
    const sorted = [...u.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    const sp = new URLSearchParams(sorted);
    return `${method.toUpperCase()}|${u.pathname}|${sp.toString()}`;
  } catch {
    return `${method.toUpperCase()}|${url}`;
  }
}

function logPayloadBytes(url: string, bytes: number): void {
  if (__DEV__) {
    console.log(`[perf] screen=${perfScreen} bytes≈${bytes} ${url.split('?')[0]}`);
  }
}

export type FetchJsonOptions = RequestInit & {
  cacheTtlMs?: number;
  skipMemoryCache?: boolean;
};

/**
 * GET JSON with in-flight request coalescing and optional TTL memory cache.
 */
export async function fetchJsonCached<T>(url: string, init: FetchJsonOptions = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const res = await fetch(url, init);
    const text = await res.text();
    logPayloadBytes(url, text.length);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  const key = buildCacheKey(method, url);
  const ttl = init.cacheTtlMs ?? 0;
  const now = Date.now();

  if (!init.skipMemoryCache && ttl > 0) {
    const hit = memory.get(key);
    if (hit && hit.expires > now) {
      return hit.data as T;
    }
  }

  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(url, init);
        const text = await res.text();
        logPayloadBytes(url, text.length);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const parsed = text ? (JSON.parse(text) as T) : ({} as T);
        if (ttl > 0) {
          memory.set(key, { data: parsed, expires: Date.now() + ttl });
        }
        return parsed;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, pending);
  }

  return pending;
}

/** Drop cached GET entries whose key contains the substring (e.g. `pi:context:`). */
export function invalidateMemoryCacheByPrefix(prefix: string): void {
  for (const key of memory.keys()) {
    if (key.includes(prefix)) memory.delete(key);
  }
}
