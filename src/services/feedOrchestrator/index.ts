import type { FeedFilter, NewsItem } from '@/src/types';
import { rankFeedArticles } from './feedRanking.service';
import type { FeedRankingResult, FeedUserContext } from './relevance.types';

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
  };
}
