import { describe, expect, it } from 'vitest';
import { coinScalarsEqual, reconcileTrendingCoins } from '../reconcileTrendingCoins';
import type { TrendingCoin } from '@/src/types';

function makeCoin(overrides: Partial<TrendingCoin> & { id: string }): TrendingCoin {
  const { id, ...rest } = overrides;
  return {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 100,
    change24h: 1,
    rank: 1,
    category: 'trending',
    ...rest,
    id,
  };
}

describe('coinScalarsEqual', () => {
  it('detects scalar changes', () => {
    const a = makeCoin({ id: 'btc', price: 100 });
    const b = makeCoin({ id: 'btc', price: 101 });
    expect(coinScalarsEqual(a, b)).toBe(false);
  });
});

describe('reconcileTrendingCoins replace mode', () => {
  it('preserves prev reference when metadata unchanged', () => {
    const prev = [makeCoin({ id: 'btc' })];
    const incoming = [makeCoin({ id: 'btc' })];
    const { coins, stats } = reconcileTrendingCoins(prev, incoming);
    expect(coins[0]).toBe(prev[0]);
    expect(stats.rowsSkipped).toBe(1);
    expect(stats.rowsUpdated).toBe(0);
  });

  it('updates when price changes without touching sparkline field', () => {
    const prev = [makeCoin({ id: 'btc', price: 100, sparklineData: [1, 2, 3] })];
    const incoming = [makeCoin({ id: 'btc', price: 105 })];
    const { coins, stats } = reconcileTrendingCoins(prev, incoming);
    expect(coins[0].price).toBe(105);
    expect(coins[0].sparklineData).toEqual([1, 2, 3]);
    expect(coins[0]).not.toBe(prev[0]);
    expect(stats.rowsUpdated).toBe(1);
  });

  it('drops coins not in incoming order', () => {
    const prev = [makeCoin({ id: 'btc' }), makeCoin({ id: 'eth', symbol: 'ETH' })];
    const incoming = [makeCoin({ id: 'eth', symbol: 'ETH' })];
    const { coins } = reconcileTrendingCoins(prev, incoming);
    expect(coins).toHaveLength(1);
    expect(coins[0].id).toBe('eth');
  });
});

describe('reconcileTrendingCoins append mode', () => {
  it('dedupes by id', () => {
    const prev = [makeCoin({ id: 'btc' })];
    const incoming = [makeCoin({ id: 'btc' }), makeCoin({ id: 'eth', symbol: 'ETH', rank: 2 })];
    const { coins, stats } = reconcileTrendingCoins(prev, incoming, { mode: 'append' });
    expect(coins).toHaveLength(2);
    expect(coins[1].id).toBe('eth');
    expect(stats.rowsSkipped).toBe(1);
    expect(stats.rowsUpdated).toBe(1);
  });
});
