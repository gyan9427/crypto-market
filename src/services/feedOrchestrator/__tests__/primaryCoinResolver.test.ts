import { describe, expect, it } from 'vitest';
import { resolvePrimaryCoin } from '../primaryCoinResolver';
import { baseContext, makeArticle, makeCoin } from './fixtures';

describe('primaryCoinResolver — Explore', () => {
  it('selects the most recent search match and ignores higher RRS coins', () => {
    const ctx = baseContext({
      mode: 'explore',
      recentSearchSymbols: ['AVAX', 'ETH', 'SOL'],
      crsBySymbol: new Map([
        ['BTC', 0.99],
        ['ETH', 0.2],
      ]),
    });

    const article = makeArticle('1', 'Market wrap', [
      makeCoin('BTC'),
      makeCoin('ETH'),
      makeCoin('DOGE'),
    ]);

    const resolved = resolvePrimaryCoin(article, ctx);
    expect(resolved?.primaryCoin.symbol).toBe('ETH');
    expect(resolved?.relevanceReason).toBe('search_match');
    expect(resolved?.prioritySource).toBe('search');
    expect(resolved?.orderedCoins[0].symbol).toBe('ETH');
  });

  it('falls back to highest RRS when no search match', () => {
    const ctx = baseContext({
      mode: 'explore',
      crsBySymbol: new Map([
        ['BTC', 0.9],
        ['XRP', 0.6],
        ['DOGE', 0.1],
      ]),
    });

    const article = makeArticle('1', 'Alts', [
      makeCoin('BTC'),
      makeCoin('XRP'),
      makeCoin('DOGE'),
    ]);

    const resolved = resolvePrimaryCoin(article, ctx);
    expect(resolved?.primaryCoin.symbol).toBe('BTC');
    expect(resolved?.relevanceReason).toBe('highest_rrs');
    expect(resolved?.prioritySource).toBe('rrs');
    expect(resolved?.priorityScore).toBe(0.9);
  });

  it('breaks RRS ties using first article coin order', () => {
    const ctx = baseContext({
      mode: 'explore',
      crsBySymbol: new Map([
        ['ETH', 0.5],
        ['SOL', 0.5],
      ]),
    });

    const article = makeArticle('1', 'Tie', [makeCoin('ETH'), makeCoin('SOL')]);
    const resolved = resolvePrimaryCoin(article, ctx);
    expect(resolved?.primaryCoin.symbol).toBe('ETH');
    expect(resolved?.relevanceReason).toBe('highest_rrs');
  });

  it('orders tags with primary first then descending RRS', () => {
    const ctx = baseContext({
      mode: 'explore',
      crsBySymbol: new Map([
        ['BTC', 0.9],
        ['ETH', 0.4],
        ['SOL', 0.7],
      ]),
    });

    const article = makeArticle('1', 'Order', [
      makeCoin('ETH'),
      makeCoin('BTC'),
      makeCoin('SOL'),
    ]);

    const resolved = resolvePrimaryCoin(article, ctx)!;
    expect(resolved.orderedCoins.map((c) => c.symbol)).toEqual(['BTC', 'SOL', 'ETH']);
  });
});

describe('primaryCoinResolver — Following', () => {
  it('ignores recent searches and picks highest RRS followed coin', () => {
    const eth = makeCoin('ETH');
    const sol = makeCoin('SOL');
    const ctx = baseContext({
      mode: 'following',
      recentSearchSymbols: ['ETH'],
      followingCoinIds: new Set([eth.id, sol.id]),
      followingSymbols: new Set(['ETH', 'SOL']),
      crsBySymbol: new Map([
        ['ETH', 0.4],
        ['SOL', 0.85],
      ]),
    });

    const article = makeArticle('1', 'Flows', [eth, makeCoin('DOGE'), sol]);
    const resolved = resolvePrimaryCoin(article, ctx);
    expect(resolved?.primaryCoin.symbol).toBe('SOL');
    expect(resolved?.relevanceReason).toBe('followed_rrs');
    expect(resolved?.prioritySource).toBe('rrs');
  });

  it('breaks followed RRS ties using first article coin order', () => {
    const btc = makeCoin('BTC');
    const eth = makeCoin('ETH');
    const ctx = baseContext({
      mode: 'following',
      followingCoinIds: new Set([btc.id, eth.id]),
      followingSymbols: new Set(['BTC', 'ETH']),
      crsBySymbol: new Map([
        ['BTC', 0.6],
        ['ETH', 0.6],
      ]),
    });

    const article = makeArticle('1', 'Tie follow', [eth, btc]);
    const resolved = resolvePrimaryCoin(article, ctx);
    expect(resolved?.primaryCoin.symbol).toBe('ETH');
    expect(resolved?.relevanceReason).toBe('followed_rrs');
  });

  it('does not promote unfollowed coins even with high RRS', () => {
    const eth = makeCoin('ETH');
    const ctx = baseContext({
      mode: 'following',
      followingCoinIds: new Set([eth.id]),
      followingSymbols: new Set(['ETH']),
      crsBySymbol: new Map([
        ['ETH', 0.3],
        ['DOGE', 0.99],
      ]),
    });

    const article = makeArticle('1', 'Meme', [makeCoin('DOGE'), eth]);
    const resolved = resolvePrimaryCoin(article, ctx);
    expect(resolved?.primaryCoin.symbol).toBe('ETH');
  });
});

describe('primaryCoinResolver — single primary contract', () => {
  it('returns exactly one primary coin (no stack)', () => {
    const ctx = baseContext({
      crsBySymbol: new Map([
        ['BTC', 0.9],
        ['ETH', 0.89],
      ]),
    });
    const article = makeArticle('1', 'Close', [makeCoin('BTC'), makeCoin('ETH')]);
    const resolved = resolvePrimaryCoin(article, ctx)!;
    expect(resolved.primaryCoin).toBeDefined();
    expect('stackCoins' in resolved).toBe(false);
  });
});
