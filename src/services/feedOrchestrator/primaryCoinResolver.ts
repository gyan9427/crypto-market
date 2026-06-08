import type { Coin, NewsItem } from '@/src/types';
import type { FeedUserContext, ResolvedCoinContext } from './relevance.types';

function symbolKey(coin: Coin): string {
  return (coin.symbol || coin.id || '').toUpperCase();
}

function coinMatchesSearchRef(coin: Coin, searchSym: string): boolean {
  const upper = searchSym.toUpperCase();
  return symbolKey(coin) === upper || coin.id === upper || coin.id.toUpperCase() === upper;
}

function rrsForCoin(coin: Coin, ctx: FeedUserContext): number {
  return ctx.crsBySymbol.get(symbolKey(coin)) ?? 0;
}

function isFollowedCoin(coin: Coin, ctx: FeedUserContext): boolean {
  const sym = symbolKey(coin);
  return ctx.followingCoinIds.has(coin.id) || ctx.followingSymbols.has(sym);
}

/** Most recent searched symbol that appears on the article (search list is newest-first). */
function findSearchMatch(article: NewsItem, ctx: FeedUserContext): Coin | null {
  for (const searchSym of ctx.recentSearchSymbols) {
    const match = article.coins.find((c) => coinMatchesSearchRef(c, searchSym));
    if (match) return match;
  }
  return null;
}

/** Highest RRS among candidates; ties break on first appearance in article.coins order. */
function pickHighestRrsCoin(
  candidates: Coin[],
  articleOrder: Coin[],
  ctx: FeedUserContext
): { coin: Coin; rrs: number } {
  if (candidates.length === 0) {
    const fallback = articleOrder[0];
    return { coin: fallback, rrs: 0 };
  }

  let bestRrs = -1;
  for (const coin of candidates) {
    const rrs = rrsForCoin(coin, ctx);
    if (rrs > bestRrs) bestRrs = rrs;
  }

  const tied = candidates.filter((c) => rrsForCoin(c, ctx) === bestRrs);
  for (const coin of articleOrder) {
    const hit = tied.find((t) => t.id === coin.id && symbolKey(t) === symbolKey(coin));
    if (hit) return { coin: hit, rrs: bestRrs };
  }

  return { coin: tied[0], rrs: bestRrs };
}

function buildOrderedCoins(primary: Coin, article: NewsItem, ctx: FeedUserContext): Coin[] {
  const primaryKey = symbolKey(primary);
  const others = article.coins.filter((c) => symbolKey(c) !== primaryKey);
  others.sort((a, b) => {
    const rrsDiff = rrsForCoin(b, ctx) - rrsForCoin(a, ctx);
    if (rrsDiff !== 0) return rrsDiff;
    return article.coins.indexOf(a) - article.coins.indexOf(b);
  });
  return [primary, ...others];
}

function resolveExplorePrimary(article: NewsItem, ctx: FeedUserContext): ResolvedCoinContext {
  const searchMatch = findSearchMatch(article, ctx);
  if (searchMatch) {
    return {
      primaryCoin: searchMatch,
      orderedCoins: buildOrderedCoins(searchMatch, article, ctx),
      relevanceReason: 'search_match',
      prioritySource: 'search',
    };
  }

  const { coin, rrs } = pickHighestRrsCoin(article.coins, article.coins, ctx);
  const reason = rrs > 0 ? 'highest_rrs' : 'fallback_article_order';

  return {
    primaryCoin: coin,
    orderedCoins: buildOrderedCoins(coin, article, ctx),
    relevanceReason: reason,
    prioritySource: 'rrs',
    priorityScore: rrs,
  };
}

function resolveFollowingPrimary(article: NewsItem, ctx: FeedUserContext): ResolvedCoinContext {
  const followedInArticle = article.coins.filter((c) => isFollowedCoin(c, ctx));

  if (followedInArticle.length > 0) {
    const { coin, rrs } = pickHighestRrsCoin(followedInArticle, article.coins, ctx);
    return {
      primaryCoin: coin,
      orderedCoins: buildOrderedCoins(coin, article, ctx),
      relevanceReason: 'followed_rrs',
      prioritySource: 'rrs',
      priorityScore: rrs,
    };
  }

  const fallback = article.coins[0];
  return {
    primaryCoin: fallback,
    orderedCoins: buildOrderedCoins(fallback, article, ctx),
    relevanceReason: 'fallback_article_order',
    prioritySource: 'rrs',
    priorityScore: 0,
  };
}

export function resolvePrimaryCoin(
  article: NewsItem,
  ctx: FeedUserContext
): ResolvedCoinContext | null {
  if (article.coins.length === 0) return null;

  if (ctx.mode === 'following') {
    return resolveFollowingPrimary(article, ctx);
  }

  return resolveExplorePrimary(article, ctx);
}
