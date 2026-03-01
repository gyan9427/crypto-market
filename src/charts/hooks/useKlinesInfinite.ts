import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKlines } from '../chartApi';
import { klinesToLWChartData } from '../transform';
import type { KlineInterval, KlineRecord } from '../types';
import { DEFAULT_INTERVAL } from '../constants';

interface UseKlinesInfiniteOptions {
  enabled?: boolean;
  limit?: number;
}

interface UseKlinesInfiniteResult {
  data: KlineRecord[];
  candlestickData: { time: string; open: number; high: number; low: number; close: number }[];
  volumeData: { time: string; value: number; color: string }[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: (from: Date, to: Date) => Promise<void>;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 500;

export function useKlinesInfinite(
  symbol: string,
  interval: KlineInterval = DEFAULT_INTERVAL,
  options: UseKlinesInfiniteOptions = {}
): UseKlinesInfiniteResult {
  const { enabled = true, limit = DEFAULT_LIMIT } = options;
  const [data, setData] = useState<KlineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingMoreRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!symbol.trim() || !enabled) return;
    setLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const klines = await fetchKlines({ symbol: symbol.trim().toUpperCase(), interval, limit });
      setData(klines);
      setHasMore(klines.length >= limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, enabled, limit]);

  const loadMore = useCallback(
    async (from: Date, to: Date) => {
      if (!symbol.trim() || !enabled || isLoadingMoreRef.current || !hasMore) return;
      isLoadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        const fromStr = from.toISOString();
        const toStr = to.toISOString();
        const olderKlines = await fetchKlines({
          symbol: symbol.trim().toUpperCase(),
          interval,
          from: fromStr,
          to: toStr,
          limit,
        });
        if (olderKlines.length > 0) {
          setData((prev) => {
            const existingTimes = new Set(
              prev.map((k) => {
                const t = typeof k.openTime === 'string' ? new Date(k.openTime) : k.openTime;
                return t.getTime();
              })
            );
            const newItems = olderKlines.filter((k) => {
              const t = typeof k.openTime === 'string' ? new Date(k.openTime) : k.openTime;
              return !existingTimes.has(t.getTime());
            });
            return [...newItems, ...prev].sort((a, b) => {
              const ta = typeof a.openTime === 'string' ? new Date(a.openTime) : a.openTime;
              const tb = typeof b.openTime === 'string' ? new Date(b.openTime) : b.openTime;
              return ta.getTime() - tb.getTime();
            });
          });
        }
        setHasMore(olderKlines.length >= limit);
      } catch {
        setHasMore(false);
      } finally {
        setLoadingMore(false);
        isLoadingMoreRef.current = false;
      }
    },
    [symbol, interval, enabled, limit, hasMore]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  const { candlestick, volume } = klinesToLWChartData(data, interval);

  return {
    data,
    candlestickData: candlestick,
    volumeData: volume,
    loading,
    loadingMore,
    error,
    refetch: fetch,
    loadMore,
    hasMore,
  };
}
