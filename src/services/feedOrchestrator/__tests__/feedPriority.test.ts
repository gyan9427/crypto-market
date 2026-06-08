import { describe, expect, it } from 'vitest';
import { computeExplorePriority, computeFollowingPriority } from '../feedPriority.service';
import { baseContext, makeArticle, makeCoin } from './fixtures';

describe('feedPriority.service', () => {
  it('search boost beats high-CRS unrelated coin on explore', () => {
    const ctx = baseContext({
      mode: 'explore',
      recentSearchSymbols: ['AVAX'],
      crsBySymbol: new Map([['BTC', 0.9], ['AVAX', 0.3]]),
    });

    const avaxArticle = makeArticle('1', 'Avalanche upgrade', [makeCoin('AVAX')]);
    const btcArticle = makeArticle('2', 'Bitcoin steady', [makeCoin('BTC')]);

    const avaxScore = computeExplorePriority(avaxArticle, ctx, []);
    const btcScore = computeExplorePriority(btcArticle, ctx, []);

    expect(avaxScore.total).toBeGreaterThan(btcScore.total);
  });

  it('follow boost elevates following coin on following feed', () => {
    const eth = makeCoin('ETH');
    const ctx = baseContext({
      mode: 'following',
      followingCoinIds: new Set([eth.id]),
      followingSymbols: new Set(['ETH']),
    });

    const followed = makeArticle('1', 'ETH news', [eth]);
    const other = makeArticle('2', 'DOGE meme', [makeCoin('DOGE')]);

    const followedScore = computeFollowingPriority(followed, ctx, []);
    const otherScore = computeFollowingPriority(other, ctx, []);

    expect(followedScore.total).toBeGreaterThan(otherScore.total);
  });
});
