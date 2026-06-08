import type { NewsItem } from '@/src/types';
import type { ScoredArticle } from './relevance.types';

const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;
const TITLE_SIMILARITY_THRESHOLD = 0.82;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(title: string): Set<string> {
  return new Set(normalizeTitle(title).split(' ').filter((t) => t.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function areNearDuplicate(a: NewsItem, b: NewsItem): boolean {
  if (a.id === b.id) return true;

  const normA = normalizeTitle(a.title);
  const normB = normalizeTitle(b.title);
  if (normA === normB) return true;

  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (Math.abs(timeA - timeB) > DEDUPE_WINDOW_MS) return false;

  const sameSource =
    a.source.toLowerCase() === b.source.toLowerCase() ||
    (a.sourceUrl && b.sourceUrl && a.sourceUrl === b.sourceUrl);

  const sim = jaccardSimilarity(titleTokens(a.title), titleTokens(b.title));
  if (sim >= TITLE_SIMILARITY_THRESHOLD) return true;

  if (sameSource && sim >= 0.65) return true;

  return false;
}

export function dedupeArticles(scored: ScoredArticle[]): { articles: ScoredArticle[]; removedCount: number } {
  const kept: ScoredArticle[] = [];
  let removedCount = 0;

  for (const entry of scored) {
    const duplicate = kept.some((k) => areNearDuplicate(k.article, entry.article));
    if (duplicate) {
      removedCount++;
      continue;
    }
    kept.push(entry);
  }

  return { articles: kept, removedCount };
}
