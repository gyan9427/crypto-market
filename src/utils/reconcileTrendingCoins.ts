import type { TrendingCoin } from '../types';
import type { ReconcileStats } from './explorePerfMetrics';

export function coinScalarsEqual(a: TrendingCoin, b: TrendingCoin): boolean {
  return (
    a.price === b.price &&
    a.change24h === b.change24h &&
    a.rank === b.rank &&
    a.name === b.name &&
    a.symbol === b.symbol &&
    a.logo === b.logo &&
    a.marketCap === b.marketCap &&
    a.volume24h === b.volume24h &&
    a.isFollowing === b.isFollowing &&
    a.category === b.category
  );
}

export interface ReconcileOptions {
  mode?: 'replace' | 'append';
}

function mergeMetadata(prevCoin: TrendingCoin, incoming: TrendingCoin, stats: ReconcileStats): TrendingCoin {
  if (coinScalarsEqual(prevCoin, incoming)) {
    stats.rowsSkipped += 1;
    return prevCoin;
  }

  stats.rowsUpdated += 1;
  return {
    ...prevCoin,
    price: incoming.price,
    change24h: incoming.change24h,
    rank: incoming.rank,
    name: incoming.name,
    symbol: incoming.symbol,
    logo: incoming.logo,
    marketCap: incoming.marketCap,
    volume24h: incoming.volume24h,
    isFollowing: incoming.isFollowing,
    category: incoming.category,
  };
}

export function reconcileTrendingCoins(
  prev: TrendingCoin[],
  incoming: TrendingCoin[],
  options: ReconcileOptions = {}
): { coins: TrendingCoin[]; stats: ReconcileStats } {
  const mode = options.mode ?? 'replace';
  const stats: ReconcileStats = {
    rowsUpdated: 0,
    rowsSkipped: 0,
    sparklinesReused: 0,
    sparklinesRecreated: 0,
  };

  if (mode === 'append') {
    const prevById = new Map(prev.map((c) => [c.id, c]));
    const appended: TrendingCoin[] = [];
    for (const coin of incoming) {
      if (prevById.has(coin.id)) {
        stats.rowsSkipped += 1;
        continue;
      }
      stats.rowsUpdated += 1;
      appended.push({ ...coin, sparklineData: undefined });
    }
    return { coins: [...prev, ...appended], stats };
  }

  const prevById = new Map(prev.map((c) => [c.id, c]));
  const coins = incoming.map((incomingCoin) => {
    const prevCoin = prevById.get(incomingCoin.id);
    if (!prevCoin) {
      stats.rowsUpdated += 1;
      return { ...incomingCoin, sparklineData: undefined };
    }
    return mergeMetadata(prevCoin, incomingCoin, stats);
  });

  return { coins, stats };
}
