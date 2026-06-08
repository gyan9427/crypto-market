import { describe, expect, it } from 'vitest';
import { applyAttentionBudget } from '../attentionBudget.service';
import type { ScoredArticle } from '../relevance.types';

function scored(id: string, symbol: string, total: number): ScoredArticle {
  return {
    article: {
      id,
      title: id,
      snippet: '',
      source: 'T',
      publishedAt: new Date(),
      coins: [],
      likes: 0,
      comments: 0,
      shares: 0,
    },
    score: { total, breakdown: {} },
    primarySymbol: symbol,
  };
}

describe('attentionBudget.service', () => {
  it('suppresses 4th consecutive BTC story', () => {
    const input = [
      scored('1', 'BTC', 50),
      scored('2', 'BTC', 49),
      scored('3', 'BTC', 48),
      scored('4', 'BTC', 47),
      scored('5', 'ETH', 40),
    ];

    const { articles, suppressedCount } = applyAttentionBudget(input, 'following');
    const symbols = articles.map((a) => a.primarySymbol);

    expect(symbols.filter((s) => s === 'BTC').length).toBeLessThanOrEqual(3);
    expect(suppressedCount).toBeGreaterThanOrEqual(1);
    expect(symbols).toContain('ETH');
  });
});
