import { useCallback, useRef, useState } from 'react';
import { fetchMarketTrend } from '../services/api';
import type { KlineRecord } from '@/src/types/kline';
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
  const { enabled = true, intervalMs = 12_000 } = options;

  const [state, setState] = useState<State>(INITIAL_STATE);

  // Stable ref to previous klines so we can reuse the same array reference
  // when data hasn't meaningfully changed (avoids SVG repaint flicker).
  const prevKlinesRef = useRef<KlineRecord[]>([]);
  const prevLatestRef = useRef<number>(0);

  const poll = useCallback(async () => {
    try {
      const trend = await fetchMarketTrend('1m', 240, { cacheTtlMs: 10_000 });

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
        openTime: point.openTime,
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

  usePollingEffect(poll, [enabled], { enabled, intervalMs, immediate: true });

  return state;
}
