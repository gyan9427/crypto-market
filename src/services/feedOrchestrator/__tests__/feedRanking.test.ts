import { describe, expect, it } from 'vitest';
import { orchestrateFeed } from '../index';
import { baseContext, makeArticle, makeCoin } from './fixtures';

describe('feedRanking', () => {
  it('returns stable ordering for identical input', () => {
    const ctx = baseContext({ recentSearchSymbols: ['AVAX'] });
    const articles = [
      makeArticle('1', 'BTC macro', [makeCoin('BTC')], 2),
      makeArticle('2', 'AVAX ecosystem', [makeCoin('AVAX')], 1),
      makeArticle('3', 'ETH flows', [makeCoin('ETH')], 3),
    ];

    const first = orchestrateFeed(articles, 'explore', ctx).articles.map((a) => a.id);
    const second = orchestrateFeed(articles, 'explore', ctx).articles.map((a) => a.id);
    expect(second).toEqual(first);
  });

  it('attaches coinContext on ranked articles', () => {
    const ctx = baseContext();
    const articles = [makeArticle('1', 'Test', [makeCoin('BTC')])];
    const result = orchestrateFeed(articles, 'explore', ctx);
    expect(result.articles[0]?.coinContext?.primaryCoin.symbol).toBe('BTC');
    expect(result.articles[0]?.feedScore?.total).toBeGreaterThan(0);
  });
});
