import type { Coin, NewsItem } from '@/src/types';
import type { FeedUserContext } from '../relevance.types';

export function makeCoin(symbol: string, overrides?: Partial<Coin>): Coin {
  return {
    id: symbol.toLowerCase(),
    symbol,
    name: symbol,
    price: 100,
    change24h: 1,
    ...overrides,
  };
}

export function makeArticle(
  id: string,
  title: string,
  coins: Coin[],
  hoursAgo = 1
): NewsItem {
  return {
    id,
    title,
    snippet: title,
    source: 'Test',
    publishedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    coins,
    relatedCoins: coins.map((c) => c.symbol),
    likes: 0,
    comments: 0,
    shares: 0,
  };
}

export function baseContext(overrides?: Partial<FeedUserContext>): FeedUserContext {
  return {
    mode: 'explore',
    followingCoinIds: new Set(),
    followingSymbols: new Set(),
    recentSearchSymbols: [],
    recentReadArticleIds: new Set(),
    activeRiskRevision: 1,
    crsBySymbol: new Map(),
    crsDeltaBySymbol: new Map(),
    sentimentShockSymbols: new Set(),
    moversTopRiskSymbols: new Set(),
    marketRegime: 'normal',
    riskStale: false,
    heldSymbols: new Set(),
    heldWeightBySymbol: new Map(),
    portfolioAnalyticsRevision: 0,
    ...overrides,
  };
}
