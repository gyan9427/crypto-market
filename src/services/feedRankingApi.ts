import type { FeedFilter, NewsItem } from '@/src/types';
import { apiRequest } from '@/src/services/api';

export type ServerRankedArticle = {
  articleId: string;
  score: number;
};

function toRankableArticle(article: NewsItem) {
  const categories: string[] = [];
  if (article.categories?.length) {
    for (const c of article.categories) {
      categories.push(typeof c === 'string' ? c : (c.key ?? c.name ?? ''));
    }
  }
  return {
    articleId: article.id,
    symbols: article.coins.map((c) => c.symbol.toUpperCase()),
    categories: categories.filter(Boolean),
    publishedAt: new Date(article.publishedAt).toISOString(),
    reactionCount: article.likes ?? 0,
  };
}

export async function refreshServerFeedRanking(
  articles: NewsItem[],
  mode: FeedFilter,
  limit = 50
): Promise<Map<string, number>> {
  try {
    const res = await apiRequest<{ ranked: ServerRankedArticle[] }>('/feed/ranked', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        limit,
        articles: articles.slice(0, 120).map(toRankableArticle),
      }),
    });
    return new Map((res.ranked ?? []).map((r) => [r.articleId, r.score]));
  } catch {
    return new Map();
  }
}
