import { useMemo, useState } from 'react';
import { fetchMarketTrend, KlineRecord } from '../services/api';
import { usePollingEffect } from './usePollingEffect';

export interface MarketOverviewState {
  klines: KlineRecord[];
  totalMarketCap: number;
  absoluteChange24h: number;
  relativeChange24h: number;
}

interface LiveMarketOverviewOptions {
  /** Parent should pass focus (e.g. `useIsFocused() && expanded`). Do not double-gate with `useIsFocused` here — it can stay false on web and block all fetches. */
  enabled?: boolean;
  /** Defaults to 12s. Kept stable in deps to avoid resetting the polling loop every WS tick. */
  intervalMs?: number;
}

const EMPTY_OVERVIEW: MarketOverviewState = {
  klines: [],
  totalMarketCap: 0,
  absoluteChange24h: 0,
  relativeChange24h: 0,
};

/**
 * Live market summary data sourced from backend APIs with periodic refresh.
 * Designed to be reused by market cards/widgets that require synchronized values.
 */
export function useLiveMarketOverview(
  options: LiveMarketOverviewOptions = {}
): { data: MarketOverviewState; hasFetched: boolean } {
  const { enabled = true, intervalMs = 12_000 } = options;
  const pollEnabled = enabled;
  const [data, setData] = useState<MarketOverviewState>(EMPTY_OVERVIEW);
  const [hasFetched, setHasFetched] = useState(false);

  usePollingEffect(
    async () => {
      try {
        const trend = await fetchMarketTrend('1m', 240, { cacheTtlMs: 10_000 });
        setData({
          klines: trend.points.map((point) => ({
            openTime: point.openTime,
            open: point.value,
            high: point.value,
            low: point.value,
            close: point.value,
            volume: 0,
          })),
          totalMarketCap: trend.latestValue,
          absoluteChange24h: trend.absoluteChange24h,
          relativeChange24h: trend.relativeChange24h,
        });
        setHasFetched(true);
      } catch {
        setHasFetched(true);
      }
    },
    [pollEnabled],
    { enabled: pollEnabled, intervalMs, immediate: true }
  );

  return useMemo(() => ({ data, hasFetched }), [data, hasFetched]);
}
