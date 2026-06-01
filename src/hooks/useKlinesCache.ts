import { useState, useEffect } from 'react';
import type { KlineInterval } from '@/src/types/kline';
import { fetchKlines } from '@/src/charts/services/chartApi';
import { toSparklineData } from '@/src/services/api';
import { usePollingEffect } from './usePollingEffect';

export interface UseKlinesCacheOptions {
  enabled?: boolean;
}

/**
 * Fetches klines for a symbol and returns close prices for sparkline rendering.
 * Caching is handled by fetchJsonCached (per-interval TTL, in-flight dedup).
 * The local module-level Map has been removed.
 */
export function useKlinesCache(
  symbol: string | undefined,
  interval: KlineInterval = '1d',
  limit: number = 48,
  options?: UseKlinesCacheOptions
): number[] {
  return useKlinesCacheState(symbol, interval, limit, options).data;
}

export function useKlinesCacheState(
  symbol: string | undefined,
  interval: KlineInterval = '1d',
  limit: number = 48,
  options: UseKlinesCacheOptions = {}
): { data: number[]; isLoading: boolean; hasFetched: boolean } {
  const { enabled: pollEnabled = true } = options;
  const [data, setData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(symbol));
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  useEffect(() => {
    if (!symbol) {
      setData([]);
      setIsLoading(false);
      setHasFetched(false);
      return;
    }
    setIsLoading(true);
    let cancelled = false;
    fetchKlines({ symbol, interval, limit })
      .then((klines) => {
        if (!cancelled) {
          setData(toSparklineData(klines));
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
  }, [symbol, interval, limit]);

  const refreshMs = interval === '1m' ? 30_000 : interval === '5m' ? 60_000 : 120_000;
  usePollingEffect(
    async () => {
      if (!symbol) return;
      const klines = await fetchKlines({ symbol, interval, limit });
      const closes = toSparklineData(klines);
      if (closes.length > 0) {
        setData(closes);
        setHasFetched(true);
      }
    },
    [symbol, interval, limit, pollEnabled],
    { enabled: Boolean(symbol && pollEnabled), intervalMs: refreshMs, immediate: false }
  );

  return { data, isLoading, hasFetched };
}
