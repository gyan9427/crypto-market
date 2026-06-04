import type { Coin, FeedFilter, NewsItem } from '@/src/types';

export type RelevanceBadgeKey =
  | 'high_risk_movement'
  | 'search_match'
  | 'sentiment_shock'
  | 'following'
  | 'regime_alert';

export type ScoreBreakdown = {
  searchedBoost?: number;
  followBoost?: number;
  rrsWeight?: number;
  crsDeltaWeight?: number;
  sentimentShock?: number;
  recency?: number;
  repetitionPenalty?: number;
  marketRegimeWeight?: number;
  engagementWeight?: number;
  narrativeBoost?: number;
  convictionBoost?: number;
};

export type FeedPriorityScore = {
  total: number;
  breakdown: ScoreBreakdown;
};

export type PrimaryCoinRelevanceReason =
  | 'search_match'
  | 'highest_rrs'
  | 'followed_rrs'
  | 'fallback_article_order';

export type ResolvedCoinContext = {
  primaryCoin: Coin;
  orderedCoins: Coin[];
  relevanceReason: PrimaryCoinRelevanceReason;
  prioritySource: 'search' | 'rrs';
  priorityScore?: number;
};

export type OrchestratedArticle = NewsItem & {
  coinContext: ResolvedCoinContext;
  feedScore: FeedPriorityScore;
};

export type FeedUserContext = {
  mode: FeedFilter;
  followingCoinIds: Set<string>;
  followingSymbols: Set<string>;
  recentSearchSymbols: string[];
  recentReadArticleIds: Set<string>;
  activeRiskRevision: number;
  crsBySymbol: Map<string, number>;
  crsDeltaBySymbol: Map<string, number>;
  sentimentShockSymbols: Set<string>;
  moversTopRiskSymbols: Set<string>;
  marketRegime: string | null;
  riskStale: boolean;
  heldSymbols: Set<string>;
  heldWeightBySymbol: Map<string, number>;
  portfolioAnalyticsRevision: number;
  narrativeVector?: Map<string, number>;
  convictionVector?: Map<string, number>;
  topThemes?: string[];
};

export type ScoredArticle = {
  article: NewsItem;
  score: FeedPriorityScore;
  primarySymbol: string;
};

export type AttentionBudgetResult = {
  articles: ScoredArticle[];
  suppressedCount: number;
};

export type FeedRankingResult = {
  articles: OrchestratedArticle[];
  removedCount: number;
  suppressedCount: number;
};
