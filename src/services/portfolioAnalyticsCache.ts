import { getAuthToken } from '@/src/services/authSession';

type CachedAnalyticsPayload = Record<string, unknown> | null;

type AnalyticsCacheEntry = {
  tokenKey: string;
  data: CachedAnalyticsPayload;
  expires: number;
};

let analyticsCache: AnalyticsCacheEntry | null = null;

const DEFAULT_TTL_MS = 60_000;

export function readPortfolioAnalyticsCache(
  tokenKey: string,
  now = Date.now()
): CachedAnalyticsPayload | undefined {
  if (analyticsCache && analyticsCache.tokenKey === tokenKey && analyticsCache.expires > now) {
    return analyticsCache.data;
  }
  return undefined;
}

export function writePortfolioAnalyticsCache(
  tokenKey: string,
  data: CachedAnalyticsPayload,
  expires: number
): void {
  analyticsCache = { tokenKey, data, expires };
}

export function clearPortfolioAnalyticsCache(): void {
  analyticsCache = null;
}

export function cacheKeyForToken(): string {
  return getAuthToken() ?? 'guest';
}

export function defaultAnalyticsExpiry(now = Date.now()): number {
  return now + DEFAULT_TTL_MS;
}
