import type { FeedFilter, NewsItem } from '@/src/types';
import { rankFeedArticles } from './feedRanking.service';
import type { FeedRankingResult, FeedUserContext, OrchestratedArticle } from './relevance.types';

export type {
  AttentionBudgetResult,
  FeedPriorityScore,
  FeedRankingResult,
  FeedUserContext,
  OrchestratedArticle,
  RelevanceBadgeKey,
  ResolvedCoinContext,
  ScoreBreakdown,
} from './relevance.types';

export {
  computeExplorePriority,
  computeFollowingPriority,
  computeRepetitionPenalty,
  passesFollowingSoftFilter,
  passesExploreFilter,
  articleTouchesFollowedCoins,
  resolvePrimarySymbolForScoring,
  scoreArticle,
} from './feedPriority.service';
export { resolvePrimaryCoin } from './primaryCoinResolver';
export { applyAttentionBudget } from './attentionBudget.service';
export { dedupeArticles } from './dedupe.service';
export { rankFeedArticles } from './feedRanking.service';

export function orchestrateFeed(
  articles: NewsItem[],
  mode: FeedFilter,
  context: FeedUserContext
): FeedRankingResult {
  return rankFeedArticles(articles, mode, context);
}

export function buildFeedUserContext(partial: Omit<FeedUserContext, 'mode'> & { mode: FeedFilter }): FeedUserContext {
  return {
    mode: partial.mode,
    followingCoinIds: partial.followingCoinIds,
    followingSymbols: partial.followingSymbols,
    recentSearchSymbols: partial.recentSearchSymbols,
    recentReadArticleIds: partial.recentReadArticleIds,
    activeRiskRevision: partial.activeRiskRevision,
    crsBySymbol: partial.crsBySymbol,
    crsDeltaBySymbol: partial.crsDeltaBySymbol,
    sentimentShockSymbols: partial.sentimentShockSymbols,
    moversTopRiskSymbols: partial.moversTopRiskSymbols,
    marketRegime: partial.marketRegime,
    riskStale: partial.riskStale,
    heldSymbols: partial.heldSymbols ?? new Set<string>(),
    heldWeightBySymbol: partial.heldWeightBySymbol ?? new Map<string, number>(),
    portfolioAnalyticsRevision: partial.portfolioAnalyticsRevision ?? 0,
    narrativeVector: partial.narrativeVector,
    convictionVector: partial.convictionVector,
    topThemes: partial.topThemes,
  };
}

export function applyServerRankBoost(
  articles: OrchestratedArticle[],
  serverScores: Map<string, number>,
  weight = 0.35
): OrchestratedArticle[] {
  if (serverScores.size === 0) return articles;
  return [...articles].sort((a, b) => {
    const scoreA = (a.feedScore?.total ?? 0) + (serverScores.get(a.id) ?? 0) * weight;
    const scoreB = (b.feedScore?.total ?? 0) + (serverScores.get(b.id) ?? 0) * weight;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
