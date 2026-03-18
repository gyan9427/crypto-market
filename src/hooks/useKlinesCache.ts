import { useState, useEffect } from 'react';
import { fetchKlines, toSparklineData, KlineInterval } from '../services/api';

const cache = new Map<string, { data: number[]; ts: number }>();
const CACHE_TTL_MS = 60 * 1000;

function buildCacheKey(symbol: string, interval: KlineInterval, limit: number): string {
  return `${symbol.trim().toUpperCase()}|${interval}|${limit}`;
}

function getCached(cacheKey: string): number[] | null {
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

function setCached(cacheKey: string, data: number[]) {
  cache.set(cacheKey, { data, ts: Date.now() });
}

/**
 * Fetches klines for a symbol and returns close prices for sparkline.
 * Uses in-memory cache to avoid duplicate requests.
 */
export function useKlinesCache(
  symbol: string | undefined,
  interval: KlineInterval = '1d',
  limit: number = 48
): number[] {
  const cacheKey = symbol ? buildCacheKey(symbol, interval, limit) : '';
  const [data, setData] = useState<number[]>(() =>
    cacheKey ? getCached(cacheKey) ?? [] : []
  );

  useEffect(() => {
    if (!symbol || !cacheKey) {
      setData([]);
      return;
    }
    const cached = getCached(cacheKey);
    if (cached && cached.length > 0) {
      setData(cached);
      return;
    }
    let cancelled = false;
    fetchKlines(symbol, interval, limit)
      .then((klines) => {
        if (!cancelled) {
          const closes = toSparklineData(klines);
          setCached(cacheKey, closes);
          setData(closes);
        }
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => { cancelled = true; };
  }, [symbol, interval, limit, cacheKey]);

  return data;
}
