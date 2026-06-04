import { describe, expect, it } from 'vitest';
import { orchestrateFeed } from '../index';
import { baseContext, makeArticle, makeCoin } from './fixtures';

describe('fallback behavior', () => {
  it('orders by recency when RRS maps are empty', () => {
    const ctx = baseContext({
      crsBySymbol: new Map(),
      crsDeltaBySymbol: new Map(),
      sentimentShockSymbols: new Set(),
      moversTopRiskSymbols: new Set(),
      activeRiskRevision: 0,
      riskStale: true,
    });

    const articles = [
      makeArticle('old', 'Older', [makeCoin('BTC')], 48),
      makeArticle('new', 'Newer', [makeCoin('ETH')], 1),
    ];

    const ranked = orchestrateFeed(articles, 'explore', ctx).articles;
    expect(ranked[0]?.id).toBe('new');
  });
});
