import React, { useState, useCallback, useEffect } from 'react';
import type { KlineRecord, KlineInterval } from '../types';
import { fetchKlines } from '../services/chartApi';

export interface UseKlinesInfiniteParams {
  symbol: string;
  interval: KlineInterval;
  limit?: number;
  exchange?: string;
}

export interface UseKlinesInfiniteResult {
  candles: KlineRecord[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refetch: () => void;
  setCandles: React.Dispatch<React.SetStateAction<KlineRecord[]>>;
}

export function dedupeAndSort(candles: KlineRecord[]): KlineRecord[] {
  const byTime = new Map<number, KlineRecord>();
  for (const c of candles) {
    if (!byTime.has(c.openTime)) byTime.set(c.openTime, c);
  }
  return Array.from(byTime.values()).sort((a, b) => a.openTime - b.openTime);
}

export function useKlinesInfinite(params: UseKlinesInfiniteParams): UseKlinesInfiniteResult {
  const { symbol, interval, limit = 500, exchange } = params;
  const [candles, setCandles] = useState<KlineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKlines({ symbol, interval, limit, exchange });
      setCandles(dedupeAndSort(data));
      setHasMore(data.length >= limit);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, limit, exchange]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || candles.length === 0) return;
    const first = candles[0];
    const to = new Date(first.openTime - 1).toISOString();
    setLoadingMore(true);
    try {
      const data = await fetchKlines({ symbol, interval, to, limit, exchange });
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      setCandles((prev) => {
        const merged = dedupeAndSort([...data, ...prev]);
        // Sliding window: cap at 2000 candles, drop oldest 500 when exceeded
        if (merged.length > 2000) return merged.slice(merged.length - 1500);
        return merged;
      });
      setHasMore(data.length >= limit);
    } finally {
      setLoadingMore(false);
    }
  }, [symbol, interval, limit, exchange, candles, loadingMore, hasMore]);

  const refetch = useCallback(() => {
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return { candles, loading, loadingMore, hasMore, error, loadMore, refetch, setCandles };
}
