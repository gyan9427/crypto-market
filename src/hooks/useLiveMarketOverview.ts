import { useMemo, useState } from 'react';
import { fetchKlines, fetchTrendingCoins, KlineRecord } from '../services/api';
import { TrendingCoin } from '../types';
import { usePollingEffect } from './usePollingEffect';

export interface MarketOverviewState {
  klines: KlineRecord[];
  topCoins: TrendingCoin[];
  totalMarketCap: number;
  absoluteChange24h: number;
  relativeChange24h: number;
}

interface LiveMarketOverviewOptions {
  enabled?: boolean;
}

const EMPTY_OVERVIEW: MarketOverviewState = {
  klines: [],
  topCoins: [],
  totalMarketCap: 0,
  absoluteChange24h: 0,
  relativeChange24h: 0,
};

function buildMarketOverview(klines: KlineRecord[], coins: TrendingCoin[]): MarketOverviewState {
  const capCoins = coins.filter((c) => Number.isFinite(c.marketCap) && (c.marketCap || 0) > 0);
  const totalMarketCap = capCoins.reduce((sum, c) => sum + (c.marketCap || 0), 0);
  const previousMarketCap = capCoins.reduce((sum, c) => {
    const pct = c.change24h || 0;
    const divisor = 1 + pct / 100;
    if (!Number.isFinite(divisor) || divisor <= 0) return sum;
    return sum + (c.marketCap || 0) / divisor;
  }, 0);
  const absoluteChange24h = totalMarketCap - previousMarketCap;
  const relativeChange24h = previousMarketCap > 0 ? (absoluteChange24h / previousMarketCap) * 100 : 0;

  return {
    klines,
    topCoins: coins,
    totalMarketCap,
    absoluteChange24h,
    relativeChange24h,
  };
}

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
      const [klines, trending] = await Promise.all([
        fetchKlines('BTC', '1m', 240),
        fetchTrendingCoins('trending'),
      ]);
      const next = buildMarketOverview(klines, trending);
      setData(next);
      setHasFetched(true);
    },
    [enabled],
    { enabled, intervalMs: 15000, immediate: true }
  );

  return useMemo(() => ({ data, hasFetched }), [data, hasFetched]);
}
