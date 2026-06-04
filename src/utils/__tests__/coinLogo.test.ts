import { describe, expect, it } from 'vitest';
import { getCoinLogoUri, buildSnapshotLogoLookup } from '../coinLogo';
import type { Coin } from '@/src/types';
import type { MarketSnapshotV2 } from '@/src/types/marketSnapshot';

const btc: Coin = {
  id: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  price: 1,
  change24h: 0,
};

const snapshot: MarketSnapshotV2 = {
  version: 2,
  snapshotGeneratedAt: '',
  etag: '1',
  snapshotRevision: 1,
  tabs: {
    trending: [
      {
        coinId: 'bitcoin',
        symbol: 'BTC',
        baseAsset: 'BTC',
        name: 'Bitcoin',
        image: 'https://example.com/btc.png',
        price: 1,
        percentChange24h: 0,
        volume24h: 0,
        sparkline: { encoding: 'flat', value: 1 },
        sparklineInterval: '1h',
      },
    ],
    topGainers: [],
    topLosers: [],
  },
};

describe('coinLogo', () => {
  it('prefers coin.logo like Market rows', () => {
    const uri = getCoinLogoUri({ ...btc, logo: 'https://cdn/logo.png' }, snapshot);
    expect(uri).toBe('https://cdn/logo.png');
  });

  it('falls back to snapshot row image by coinId or symbol', () => {
    expect(getCoinLogoUri(btc, snapshot)).toBe('https://example.com/btc.png');
    expect(getCoinLogoUri({ ...btc, id: 'btc', symbol: 'BTC' }, snapshot)).toBe(
      'https://example.com/btc.png'
    );
  });

  it('builds lookup for all snapshot tabs', () => {
    const lookup = buildSnapshotLogoLookup(snapshot);
    expect(lookup.get('BTC')).toBe('https://example.com/btc.png');
    expect(lookup.get('bitcoin')).toBe('https://example.com/btc.png');
  });
});
