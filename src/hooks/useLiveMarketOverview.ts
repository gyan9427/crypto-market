import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMarketTrend } from '../services/api';
import type { KlineInterval, KlineRecord } from '@/src/types/kline';
import { usePollingEffect } from './usePollingEffect';

export interface MarketOverviewData {
  klines: KlineRecord[];
  totalMarketCap: number;
  absoluteChange24h: number;
  relativeChange24h: number;
  high24h: number;
  low24h: number;
}

interface LiveMarketOverviewOptions {
  enabled?: boolean;
  intervalMs?: number;
  interval?: KlineInterval;
  limit?: number;
}

const EMPTY_DATA: MarketOverviewData = {
  klines: [],
  totalMarketCap: 0,
  absoluteChange24h: 0,
  relativeChange24h: 0,
  high24h: 0,
  low24h: 0,
};

interface State {
  data: MarketOverviewData;
  hasFetched: boolean;
}

const INITIAL_STATE: State = { data: EMPTY_DATA, hasFetched: false };

export function useLiveMarketOverview(
  options: LiveMarketOverviewOptions = {}
): { data: MarketOverviewData; hasFetched: boolean } {
  const { enabled = true, intervalMs = 12_000, interval = '1m', limit = 240 } = options;

  const [state, setState] = useState<State>(INITIAL_STATE);

  const prevKlinesRef = useRef<KlineRecord[]>([]);
  const prevLatestRef = useRef<number>(0);

  // Keep mutable refs so the poll callback always reads the latest values
  // without needing to be recreated when they change.
  const intervalRef = useRef(interval);
  const limitRef    = useRef(limit);
  intervalRef.current = interval;
  limitRef.current    = limit;

  // Reset to loading state whenever the user picks a different range.
  useEffect(() => {
    setState(INITIAL_STATE);
    prevKlinesRef.current = [];
    prevLatestRef.current = 0;
  }, [interval, limit]);

  const poll = useCallback(async () => {
    try {
      const trend = await fetchMarketTrend(intervalRef.current, limitRef.current, { cacheTtlMs: 10_000 });

      // Treat any response with no points or a non-positive market cap as a
      // transient/degraded payload (the backend or its upstream occasionally
      // returns zeros while a cache warms up or a fan-out partially fails).
      // If we already have good data on screen, ignore the bad response so
      // the UI doesn't flicker $X → $0 → $X between polls. Only surface the
      // empty state on the very first fetch so the skeleton can resolve.
      const isDegraded = trend.points.length === 0 || !(trend.latestValue > 0);
      if (isDegraded) {
        setState((prev) =>
          prev.hasFetched ? prev : { ...prev, hasFetched: true }
        );
        return;
      }

      const sameLength = trend.points.length === prevKlinesRef.current.length;
      const sameLatest = trend.latestValue === prevLatestRef.current;

      // Bail out without a re-render if data hasn't changed.
      if (sameLength && sameLatest) return;

      const values = trend.points.map((p) => p.value);
      const high24h = values.length ? Math.max(...values) : 0;
      const low24h  = values.length ? Math.min(...values) : 0;

      const newKlines: KlineRecord[] = trend.points.map((point) => ({
        openTime:
          typeof point.openTime === 'number'
            ? point.openTime
            : new Date(point.openTime).getTime(),
        open: point.value,
        high: point.value,
        low: point.value,
        close: point.value,
        volume: 0,
      }));

      prevKlinesRef.current = newKlines;
      prevLatestRef.current = trend.latestValue;

      // Single setState → single render pass.
      setState({
        hasFetched: true,
        data: {
          klines: newKlines,
          totalMarketCap: trend.latestValue,
          absoluteChange24h: trend.absoluteChange24h,
          relativeChange24h: trend.relativeChange24h,
          high24h,
          low24h,
        },
      });
    } catch {
      setState((prev) =>
        prev.hasFetched ? prev : { ...prev, hasFetched: true }
      );
    }
  }, []);

  // Include interval and limit in deps so polling restarts immediately when
  // the user switches ranges rather than waiting for the next tick.
  usePollingEffect(poll, [enabled, interval, limit], { enabled, intervalMs, immediate: true });

  return state;
}
