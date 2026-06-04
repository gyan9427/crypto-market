import type { FeedFilter } from '@/src/types';
import type { AttentionBudgetResult, ScoredArticle } from './relevance.types';

const LIMITS = {
  following: {
    maxConsecutiveSameCoin: 3,
    maxPerCoinInWindow: 4,
    windowSize: 20,
    minScoreFloor: 8,
  },
  explore: {
    maxConsecutiveSameCoin: 3,
    maxPerCoinInWindow: 5,
    windowSize: 25,
    minScoreFloor: 5,
  },
} as const;

export function applyAttentionBudget(
  scored: ScoredArticle[],
  mode: FeedFilter
): AttentionBudgetResult {
  const limits = LIMITS[mode];
  const result: ScoredArticle[] = [];
  const coinCounts = new Map<string, number>();
  let suppressedCount = 0;
  let lastSymbol = '';
  let consecutiveSame = 0;

  for (const entry of scored) {
    const sym = entry.primarySymbol;

    if (entry.score.total < limits.minScoreFloor) {
      suppressedCount++;
      continue;
    }

    if (sym === lastSymbol) {
      consecutiveSame++;
    } else {
      consecutiveSame = 1;
      lastSymbol = sym;
    }

    if (consecutiveSame > limits.maxConsecutiveSameCoin) {
      suppressedCount++;
      continue;
    }

    const windowStart = Math.max(0, result.length - limits.windowSize);
    const windowSlice = result.slice(windowStart);
    const inWindow = windowSlice.filter((e) => e.primarySymbol === sym).length;
    const totalForCoin = coinCounts.get(sym) ?? 0;

    if (inWindow >= limits.maxPerCoinInWindow || totalForCoin >= limits.maxPerCoinInWindow) {
      suppressedCount++;
      continue;
    }

    result.push(entry);
    coinCounts.set(sym, totalForCoin + 1);
  }

  return { articles: result, suppressedCount };
}
