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
  enabled?: boolean;
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
  const { enabled = true } = options;
  const [data, setData] = useState<MarketOverviewState>(EMPTY_OVERVIEW);
  const [hasFetched, setHasFetched] = useState(false);

  usePollingEffect(
    async () => {
      const trend = await fetchMarketTrend('1m', 240);
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
    },
    [enabled],
    { enabled, intervalMs: 15000, immediate: true }
  );

  return useMemo(() => ({ data, hasFetched }), [data, hasFetched]);
}
