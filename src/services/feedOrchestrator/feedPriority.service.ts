import type { NewsItem } from '@/src/types';
import type { FeedPriorityScore, FeedUserContext, ScoreBreakdown } from './relevance.types';

const WEIGHTS = {
  followBoost: 120,
  searchedBoostMax: 150,
  searchedBoostDecay: 18,
  crsMax: 35,
  crsMultiplier: 40,
  crsCap: 0.15,
  crsDeltaMax: 25,
  crsDeltaMultiplier: 80,
  sentimentShock: 30,
  recencyHalfLifeHours: 18,
  recencyMax: 40,
  repetitionPenalty: 22,
  engagementMax: 12,
  marketRegimeElevated: 15,
  marketRegimePanic: 22,
  globalExploreThreshold: 25,
  heldBoostMax: 80,
  narrativeBoostMax: 60,
  convictionBoostMax: 40,
} as const;

const HOUR_MS = 60 * 60 * 1000;

function symbolKey(coin: { symbol?: string; id?: string }): string {
  return (coin.symbol || coin.id || '').toUpperCase();
}

function recencyWeight(publishedAt: Date): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageHours = Math.max(0, ageMs / HOUR_MS);
  const decay = Math.exp(-ageHours / WEIGHTS.recencyHalfLifeHours);
  return WEIGHTS.recencyMax * decay;
}

function crsAmplifier(crs: number): number {
  return 1 + Math.min(crs * WEIGHTS.crsCap, WEIGHTS.crsCap);
}

function maxCrsAmongCoins(article: NewsItem, ctx: FeedUserContext): { crs: number; symbol: string } {
  let best = 0;
  let sym = '';
  for (const coin of article.coins) {
    const s = symbolKey(coin);
    const crs = ctx.crsBySymbol.get(s) ?? 0;
    if (crs > best) {
      best = crs;
      sym = s;
    }
  }
  return { crs: best, symbol: sym };
}

function searchedBoostForArticle(article: NewsItem, ctx: FeedUserContext): number {
  let boost = 0;
  const symbols = new Set(article.coins.map(symbolKey));
  ctx.recentSearchSymbols.forEach((searchSym, index) => {
    const upper = searchSym.toUpperCase();
    if (symbols.has(upper)) {
      const tier = Math.max(0, WEIGHTS.searchedBoostMax - index * WEIGHTS.searchedBoostDecay);
      boost = Math.max(boost, tier);
    }
  });
  return boost;
}

function heldBoostForArticle(article: NewsItem, ctx: FeedUserContext): number {
  if (ctx.heldSymbols.size === 0) return 0;
  let best = 0;
  for (const coin of article.coins) {
    const sym = symbolKey(coin);
    if (!ctx.heldSymbols.has(sym)) continue;
    const w = ctx.heldWeightBySymbol.get(sym) ?? 0;
    best = Math.max(best, WEIGHTS.heldBoostMax * Math.min(1, w * 2));
  }
  return best;
}

function narrativeBoostForArticle(article: NewsItem, ctx: FeedUserContext): number {
  if (!ctx.narrativeVector || ctx.narrativeVector.size === 0) return 0;
  const tags = (article.categories ?? []).map((c) => c.key);
  let best = 0;
  for (const tag of tags) {
    const pct = ctx.narrativeVector.get(String(tag).toUpperCase()) ?? 0;
    if (pct > 0) best = Math.max(best, WEIGHTS.narrativeBoostMax * Math.min(1, pct / 100));
  }
  return best;
}

function convictionBoostForArticle(article: NewsItem, ctx: FeedUserContext): number {
  if (!ctx.convictionVector || ctx.convictionVector.size === 0) return 0;
  let best = 0;
  for (const coin of article.coins) {
    const sym = symbolKey(coin);
    const conviction = ctx.convictionVector.get(sym) ?? 0;
    if (conviction > 0) best = Math.max(best, WEIGHTS.convictionBoostMax * conviction);
  }
  return best;
}

function followBoostForArticle(article: NewsItem, ctx: FeedUserContext): number {
  const hasFollowed = article.coins.some(
    (c) => ctx.followingCoinIds.has(c.id) || ctx.followingSymbols.has(symbolKey(c))
  );
  return hasFollowed ? WEIGHTS.followBoost : 0;
}

function sentimentShockForArticle(article: NewsItem, ctx: FeedUserContext): number {
  const hit = article.coins.some((c) => ctx.sentimentShockSymbols.has(symbolKey(c)));
  return hit ? WEIGHTS.sentimentShock : 0;
}

function crsDeltaForArticle(article: NewsItem, ctx: FeedUserContext): number {
  let best = 0;
  for (const coin of article.coins) {
    const delta = Math.abs(ctx.crsDeltaBySymbol.get(symbolKey(coin)) ?? 0);
    best = Math.max(best, delta);
  }
  return Math.min(WEIGHTS.crsDeltaMax, best * WEIGHTS.crsDeltaMultiplier);
}

function engagementWeight(article: NewsItem): number {
  const total = article.reactions?.total ?? 0;
  if (total <= 0) return 0;
  return Math.min(WEIGHTS.engagementMax, Math.log10(total + 1) * 4);
}

function marketRegimeWeight(article: NewsItem, ctx: FeedUserContext): number {
  const regime = (ctx.marketRegime || 'normal').toLowerCase();
  if (regime === 'panic') return WEIGHTS.marketRegimePanic;
  if (regime === 'elevated' || regime === 'risk_off') return WEIGHTS.marketRegimeElevated;
  return 0;
}

function coinCrsWeight(article: NewsItem, ctx: FeedUserContext): number {
  const { crs } = maxCrsAmongCoins(article, ctx);
  if (crs <= 0) return 0;
  const amplified = crs * WEIGHTS.crsMultiplier * crsAmplifier(crs);
  return Math.min(WEIGHTS.crsMax, amplified);
}

export function computeRepetitionPenalty(
  primarySymbol: string,
  recentPrimarySymbols: string[]
): number {
  const consecutive = recentPrimarySymbols.filter((s) => s === primarySymbol).length;
  if (consecutive < 2) return 0;
  return (consecutive - 1) * WEIGHTS.repetitionPenalty;
}

export function resolvePrimarySymbolForScoring(article: NewsItem, ctx: FeedUserContext): string {
  const coins = article.coins;
  if (coins.length === 0) return 'UNKNOWN';

  for (const searchSym of ctx.recentSearchSymbols) {
    const upper = searchSym.toUpperCase();
    const match = coins.find((c) => symbolKey(c) === upper || c.id === upper);
    if (match) return symbolKey(match);
  }

  const followed = coins.find(
    (c) => ctx.followingCoinIds.has(c.id) || ctx.followingSymbols.has(symbolKey(c))
  );
  if (followed) return symbolKey(followed);

  const { symbol } = maxCrsAmongCoins(article, ctx);
  if (symbol) return symbol;

  const shock = coins.find((c) => ctx.sentimentShockSymbols.has(symbolKey(c)));
  if (shock) return symbolKey(shock);

  return symbolKey(coins[0]);
}

export function computeFollowingPriority(
  article: NewsItem,
  ctx: FeedUserContext,
  recentPrimarySymbols: string[]
): FeedPriorityScore {
  const primarySymbol = resolvePrimarySymbolForScoring(article, ctx);
  const breakdown: ScoreBreakdown = {
    followBoost: followBoostForArticle(article, ctx) + heldBoostForArticle(article, ctx),
    searchedBoost: searchedBoostForArticle(article, ctx) * 0.35,
    rrsWeight: coinCrsWeight(article, ctx),
    crsDeltaWeight: crsDeltaForArticle(article, ctx),
    sentimentShock: sentimentShockForArticle(article, ctx),
    narrativeBoost: narrativeBoostForArticle(article, ctx),
    convictionBoost: convictionBoostForArticle(article, ctx),
    recency: recencyWeight(article.publishedAt),
    repetitionPenalty: computeRepetitionPenalty(primarySymbol, recentPrimarySymbols),
  };

  const total =
    (breakdown.followBoost ?? 0) +
    (breakdown.searchedBoost ?? 0) +
    (breakdown.rrsWeight ?? 0) +
    (breakdown.crsDeltaWeight ?? 0) +
    (breakdown.sentimentShock ?? 0) +
    (breakdown.narrativeBoost ?? 0) +
    (breakdown.convictionBoost ?? 0) +
    (breakdown.recency ?? 0) -
    (breakdown.repetitionPenalty ?? 0);

  return { total, breakdown };
}

export function computeExplorePriority(
  article: NewsItem,
  ctx: FeedUserContext,
  recentPrimarySymbols: string[]
): FeedPriorityScore {
  const primarySymbol = resolvePrimarySymbolForScoring(article, ctx);
  const breakdown: ScoreBreakdown = {
    searchedBoost: searchedBoostForArticle(article, ctx),
    followBoost: heldBoostForArticle(article, ctx),
    rrsWeight: coinCrsWeight(article, ctx),
    crsDeltaWeight: crsDeltaForArticle(article, ctx),
    sentimentShock: sentimentShockForArticle(article, ctx),
    narrativeBoost: narrativeBoostForArticle(article, ctx),
    convictionBoost: convictionBoostForArticle(article, ctx),
    marketRegimeWeight: marketRegimeWeight(article, ctx),
    engagementWeight: engagementWeight(article),
    recency: recencyWeight(article.publishedAt),
    repetitionPenalty: computeRepetitionPenalty(primarySymbol, recentPrimarySymbols) * 0.5,
  };

  const total =
    (breakdown.searchedBoost ?? 0) +
    (breakdown.followBoost ?? 0) +
    (breakdown.rrsWeight ?? 0) +
    (breakdown.crsDeltaWeight ?? 0) +
    (breakdown.sentimentShock ?? 0) +
    (breakdown.narrativeBoost ?? 0) +
    (breakdown.convictionBoost ?? 0) +
    (breakdown.marketRegimeWeight ?? 0) +
    (breakdown.engagementWeight ?? 0) +
    (breakdown.recency ?? 0) -
    (breakdown.repetitionPenalty ?? 0);

  return { total, breakdown };
}

/** True when any tagged coin matches the user's follows (by coin id or ticker). */
export function articleTouchesFollowedCoins(article: NewsItem, ctx: FeedUserContext): boolean {
  if (ctx.followingCoinIds.size === 0 && ctx.followingSymbols.size === 0) {
    return false;
  }
  return article.coins.some(
    (c) => ctx.followingCoinIds.has(c.id) || ctx.followingSymbols.has(symbolKey(c))
  );
}

/** Following tab: only articles related to followed coins. */
export function passesFollowingSoftFilter(article: NewsItem, ctx: FeedUserContext): boolean {
  return articleTouchesFollowedCoins(article, ctx);
}

/** Explore tab: hide articles that mention any followed coin. */
export function passesExploreFilter(article: NewsItem, ctx: FeedUserContext): boolean {
  return !articleTouchesFollowedCoins(article, ctx);
}

export function scoreArticle(
  article: NewsItem,
  ctx: FeedUserContext,
  recentPrimarySymbols: string[]
): FeedPriorityScore {
  if (ctx.mode === 'following') {
    return computeFollowingPriority(article, ctx, recentPrimarySymbols);
  }
  return computeExplorePriority(article, ctx, recentPrimarySymbols);
}
