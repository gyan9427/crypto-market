import type { TrendingCoin } from '../types';
import { isExploreReconcileRowsEnabled } from '../config/exploreFeatureFlags';
import { reconcileTrendingCoins } from './reconcileTrendingCoins';
import { recordPollReconcile } from './explorePerfMetrics';

/** Strip sparkline — historical baseline lives in sparklineHistoryHub, not coin state. */
export function toMetadataCoins(coins: TrendingCoin[]): TrendingCoin[] {
  return coins.map((c) => (c.sparklineData ? { ...c, sparklineData: undefined } : c));
}

export function applyMetadataCoins(
  prev: TrendingCoin[],
  pageCoins: TrendingCoin[],
  mode: 'replace' | 'append'
): TrendingCoin[] {
  const incoming = toMetadataCoins(pageCoins);

  if (!isExploreReconcileRowsEnabled()) {
    if (mode === 'append') return [...prev, ...incoming];
    return incoming;
  }

  const { coins, stats } = reconcileTrendingCoins(prev, incoming, { mode });
  if (mode === 'replace' || stats.rowsUpdated > 0 || stats.rowsSkipped > 0) {
    recordPollReconcile(stats);
  }
  return coins;
}

/** @deprecated Use applyMetadataCoins — snapshot sparklines are not used for Explore rows. */
export function applyEnrichedCoins(
  prev: TrendingCoin[],
  pageCoins: TrendingCoin[],
  _snapshot: unknown,
  mode: 'replace' | 'append'
): TrendingCoin[] {
  return applyMetadataCoins(prev, pageCoins, mode);
}

export function buildPrevSparklineMap(
  coins: TrendingCoin[]
): Map<string, number[] | undefined> {
  return new Map(coins.map((c) => [c.id, c.sparklineData]));
}
