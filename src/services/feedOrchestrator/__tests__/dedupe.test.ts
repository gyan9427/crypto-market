import { describe, expect, it } from 'vitest';
import { dedupeArticles } from '../dedupe.service';
import { makeArticle, makeCoin } from './fixtures';
import type { ScoredArticle } from '../relevance.types';

function wrap(article: ReturnType<typeof makeArticle>): ScoredArticle {
  return {
    article,
    score: { total: 10, breakdown: {} },
    primarySymbol: article.coins[0]?.symbol ?? 'X',
  };
}

describe('dedupe.service', () => {
  it('collapses near-identical headlines', () => {
    const coin = makeCoin('BTC');
    const a = makeArticle('1', 'Bitcoin hits new high today', [coin], 1);
    const b = makeArticle('2', 'Bitcoin hits new high today!', [coin], 1);
    b.source = a.source;

    const { articles, removedCount } = dedupeArticles([wrap(a), wrap(b)]);
    expect(articles.length).toBe(1);
    expect(removedCount).toBe(1);
  });
});
