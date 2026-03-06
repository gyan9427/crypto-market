import { useState, useCallback, useEffect } from 'react';
import type { KlineRecord, KlineInterval } from '../types';
import { fetchKlines } from '../services/chartApi';

export interface UseKlinesInfiniteParams {
  symbol: string;
  interval: KlineInterval;
  limit?: number;
}

export interface UseKlinesInfiniteResult {
  candles: KlineRecord[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

function toMs(v: Date | string): number {
  return typeof v === 'string' ? new Date(v).getTime() : v.getTime();
}

function dedupeAndSort(candles: KlineRecord[]): KlineRecord[] {
  const byTime = new Map<number, KlineRecord>();
  for (const c of candles) {
    const t = toMs(c.openTime);
    if (!byTime.has(t)) byTime.set(t, c);
  }
  return Array.from(byTime.values()).sort((a, b) => toMs(a.openTime) - toMs(b.openTime));
}

export function useKlinesInfinite(params: UseKlinesInfiniteParams): UseKlinesInfiniteResult {
  const { symbol, interval, limit = 500 } = params;
  const [candles, setCandles] = useState<KlineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchKlines({ symbol, interval, limit });
      setCandles(dedupeAndSort(data));
      setHasMore(data.length >= limit);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, limit]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || candles.length === 0) return;
    const first = candles[0];
    const toTime = toMs(first.openTime) - 1;
    const to = new Date(toTime).toISOString();
    setLoadingMore(true);
    try {
      const data = await fetchKlines({ symbol, interval, to, limit });
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      setCandles((prev) => dedupeAndSort([...data, ...prev]));
      setHasMore(data.length >= limit);
    } finally {
      setLoadingMore(false);
    }
  }, [symbol, interval, limit, candles, loadingMore, hasMore]);

  const refetch = useCallback(() => {
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return { candles, loading, loadingMore, hasMore, loadMore, refetch };
}
