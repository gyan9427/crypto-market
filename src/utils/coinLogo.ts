import type { Coin } from '@/src/types';
import type { MarketSnapshotV2 } from '@/src/types/marketSnapshot';

function symbolKey(coin: Pick<Coin, 'symbol' | 'id'>): string {
  return (coin.symbol || coin.id || '').toUpperCase();
}

/** Same index pattern as market list rows (`coinId`, `symbol`, `baseAsset` → `image`). */
export function buildSnapshotLogoLookup(
  snapshot: MarketSnapshotV2 | null | undefined
): Map<string, string> {
  const lookup = new Map<string, string>();
  if (!snapshot) return lookup;

  for (const rows of Object.values(snapshot.tabs)) {
    for (const row of rows) {
      if (!row.image) continue;
      lookup.set(row.coinId, row.image);
      lookup.set(row.coinId.toLowerCase(), row.image);
      lookup.set(row.symbol.toUpperCase(), row.image);
      lookup.set(row.baseAsset.toUpperCase(), row.image);
    }
  }
  return lookup;
}

/**
 * Resolve logo URI the same way Market rows do: `coin.logo` first, then snapshot `image`.
 */
export function getCoinLogoUri(
  coin: Coin,
  snapshot: MarketSnapshotV2 | null | undefined
): string | undefined {
  if (coin.logo) return coin.logo;
  const lookup = buildSnapshotLogoLookup(snapshot);
  const sym = symbolKey(coin);
  return (
    lookup.get(coin.id) ??
    lookup.get(coin.id.toLowerCase()) ??
    lookup.get(sym) ??
    undefined
  );
}

/** Returns coin with `logo` set when resolvable (Market `TrendingCoin` shape). */
export function enrichCoinWithLogo(
  coin: Coin,
  snapshot: MarketSnapshotV2 | null | undefined
): Coin {
  const logo = getCoinLogoUri(coin, snapshot);
  return logo && logo !== coin.logo ? { ...coin, logo } : coin;
}
