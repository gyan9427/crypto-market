import { describe, expect, it } from 'vitest';
import {
  appendSparklineLivePrice,
  getSparklinePrices,
  getSparklineRevision,
  initSparklineBaseline,
  initSparklineFallback,
  isSparklineBaselineReady,
  SPARKLINE_MAX_POINTS,
} from '../../hooks/sparklineHistoryHub';

describe('sparklineHistoryHub', () => {
  it('initializes baseline once', () => {
    const closes = [1, 2, 3, 4, 5];
    expect(initSparklineBaseline('btc', closes)).toBe(true);
    const first = getSparklinePrices('BTC');
    expect(initSparklineBaseline('btc', [9, 9, 9])).toBe(true);
    expect(getSparklinePrices('BTC')).toBe(first);
    expect(getSparklinePrices('BTC')).toEqual(closes);
  });

  it('mutates in place on append without changing array reference', () => {
    initSparklineBaseline('eth', [10, 11, 12]);
    const before = getSparklinePrices('ETH');
    const revBefore = getSparklineRevision('ETH');
    appendSparklineLivePrice('ETH', 13, Date.now() + 60_000);
    const after = getSparklinePrices('ETH');
    expect(after).toBe(before);
    expect(after[after.length - 1]).toBe(13);
    expect(getSparklineRevision('ETH')).toBeGreaterThan(revBefore);
  });

  it('shifts oldest point when window is full', () => {
    const baseline = Array.from({ length: SPARKLINE_MAX_POINTS }, (_, i) => i + 1);
    initSparklineBaseline('sol', baseline);
    const arr = getSparklinePrices('SOL');
    const first = arr[0];
    appendSparklineLivePrice('SOL', 999, Date.now() + 120_000);
    expect(arr.length).toBe(SPARKLINE_MAX_POINTS);
    expect(arr[0]).not.toBe(first);
    expect(arr[arr.length - 1]).toBe(999);
  });

  it('creates fallback baseline when klines unavailable', () => {
    expect(initSparklineFallback('ada', 0.42)).toBe(true);
    expect(isSparklineBaselineReady('ADA')).toBe(true);
    expect(getSparklinePrices('ADA')).toEqual([0.42, 0.42]);
  });
});
