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
  return useKlinesCacheState(symbol, interval, limit).data;
}

export function useKlinesCacheState(
  symbol: string | undefined,
  interval: KlineInterval = '1d',
  limit: number = 48
): { data: number[]; isLoading: boolean; hasFetched: boolean } {
  const cacheKey = symbol ? buildCacheKey(symbol, interval, limit) : '';
  const initialCached = cacheKey ? getCached(cacheKey) ?? [] : [];
  const [data, setData] = useState<number[]>(initialCached);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(symbol) && initialCached.length === 0);
  const [hasFetched, setHasFetched] = useState<boolean>(initialCached.length > 0);

  useEffect(() => {
    if (!symbol || !cacheKey) {
      setData([]);
      setIsLoading(false);
      setHasFetched(false);
      return;
    }
    const cached = getCached(cacheKey);
    if (cached && cached.length > 0) {
      setData(cached);
      setIsLoading(false);
      setHasFetched(true);
      return;
    }
    setIsLoading(true);
    let cancelled = false;
    fetchKlines(symbol, interval, limit)
      .then((klines) => {
        if (!cancelled) {
          const closes = toSparklineData(klines);
          setCached(cacheKey, closes);
          setData(closes);
          setHasFetched(true);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          setHasFetched(true);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [symbol, interval, limit, cacheKey]);

  useEffect(() => {
    if (!symbol || !cacheKey) return;
    const refreshMs = interval === '1m' ? 15000 : interval === '5m' ? 30000 : 60000;
    let cancelled = false;

    const refresh = async () => {
      try {
        const klines = await fetchKlines(symbol, interval, limit);
        if (cancelled) return;
        const closes = toSparklineData(klines);
        if (closes.length > 0) {
          setCached(cacheKey, closes);
          setData(closes);
          setHasFetched(true);
        }
      } catch {
        // Keep last good dataset; polling failures should not blank chart.
      }
    };

    const timer = setInterval(refresh, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol, interval, limit, cacheKey]);

  return { data, isLoading, hasFetched };
}
