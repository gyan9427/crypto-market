import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchKlines } from '../chartApi';
import { klinesToLineData } from '../transform';
import type { KlineInterval, KlineRecord, ChartDataPoint } from '../types';
import { DEFAULT_INTERVAL } from '../constants';

interface UseKlinesOptions {
  enabled?: boolean;
  /** Optional max points per request/render path */
  limit?: number;
}

interface UseKlinesResult {
  data: KlineRecord[];
  chartData: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useKlines(
  symbol: string,
  interval: KlineInterval = DEFAULT_INTERVAL,
  options: UseKlinesOptions = {}
): UseKlinesResult {
  const { enabled = true, limit } = options;
  const [data, setData] = useState<KlineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!symbol.trim() || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const intervalLimit =
        limit ??
        (interval === '1m'
          ? 240
          : interval === '5m'
            ? 300
            : interval === '1h'
              ? 500
              : 400);
      const klines = await fetchKlines({
        symbol: symbol.trim().toUpperCase(),
        interval,
        limit: intervalLimit,
      });
      // Keep render payload bounded on mobile to avoid chart OOM/crashes.
      const bounded = klines.length > intervalLimit ? klines.slice(-intervalLimit) : klines;
      setData(bounded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, enabled, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const chartData = useMemo(() => klinesToLineData(data, 'close', interval), [data, interval]);

  return {
    data,
    chartData,
    loading,
    error,
    refetch: fetch,
  };
}
