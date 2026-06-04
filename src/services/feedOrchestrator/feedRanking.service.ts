import type { FeedFilter, NewsItem } from '@/src/types';
import { applyAttentionBudget } from './attentionBudget.service';
import { dedupeArticles } from './dedupe.service';
import {
  passesExploreFilter,
  passesFollowingSoftFilter,
  resolvePrimarySymbolForScoring,
  scoreArticle,
} from './feedPriority.service';
import { resolvePrimaryCoin } from './primaryCoinResolver';
import type {
  FeedRankingResult,
  FeedUserContext,
  OrchestratedArticle,
  ScoredArticle,
} from './relevance.types';

function scoreAndSort(articles: NewsItem[], ctx: FeedUserContext): ScoredArticle[] {
  const filtered = articles.filter((a) =>
    ctx.mode === 'following'
      ? passesFollowingSoftFilter(a, ctx)
      : passesExploreFilter(a, ctx)
  );

  const recentSymbols: string[] = [];
  const scored: ScoredArticle[] = filtered.map((article) => {
    const score = scoreArticle(article, ctx, recentSymbols);
    const primarySymbol = resolvePrimarySymbolForScoring(article, ctx);
    recentSymbols.push(primarySymbol);
    return { article, score, primarySymbol };
  });

  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
  });

  return scored;
}

function attachCoinContext(
  entries: ScoredArticle[],
  ctx: FeedUserContext
): OrchestratedArticle[] {
  const result: OrchestratedArticle[] = [];

  for (const { article, score } of entries) {
    const coinContext = resolvePrimaryCoin(article, ctx);
    if (!coinContext) {
      continue;
    }
    result.push({
      ...article,
      coins: coinContext.orderedCoins,
      coinContext,
      feedScore: score,
    });
  }

  return result;
}

export function rankFeedArticles(
  articles: NewsItem[],
  mode: FeedFilter,
  ctx: FeedUserContext
): FeedRankingResult {
  const contextWithMode: FeedUserContext = { ...ctx, mode };

  const scored = scoreAndSort(articles, contextWithMode);
  const { articles: deduped, removedCount } = dedupeArticles(scored);
  const { articles: budgeted, suppressedCount } = applyAttentionBudget(deduped, mode);
  const orchestrated = attachCoinContext(budgeted, contextWithMode);

  return {
    articles: orchestrated,
    removedCount,
    suppressedCount,
  };
}
