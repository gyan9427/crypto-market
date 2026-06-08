import { API_BASE_URL } from './api';
import { fetchJsonCached } from './requestCache';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type CoinSentimentDto = {
  symbol: string;
  weightedScore?: number;
  normalizedScore?: number;
  confidence?: number;
  articleCount?: number;
  bullishRatio?: number;
  bearishRatio?: number;
  riskRatio?: number;
  computedAt?: string;
  revision?: number;
};

export type SentimentTrendingData = {
  generatedAt: string | null;
  revision: number;
  topBullish: CoinSentimentDto[];
  topBearish: CoinSentimentDto[];
};

const SHOCK_RISK_RATIO = 0.45;
const SHOCK_SCORE_DELTA = 0.12;

export const sentimentApi = {
  async fetchTrending(): Promise<SentimentTrendingData | null> {
    try {
      const res = await fetchJsonCached<ApiResponse<SentimentTrendingData>>(
        `${API_BASE_URL}/news/sentiment/trending`,
        { cacheTtlMs: 120_000 }
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  async fetchCoin(symbol: string): Promise<CoinSentimentDto | null> {
    try {
      const res = await fetchJsonCached<ApiResponse<CoinSentimentDto>>(
        `${API_BASE_URL}/news/sentiment/${encodeURIComponent(symbol)}`,
        { cacheTtlMs: 120_000 }
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  shockSymbolsFromTrending(
    trending: SentimentTrendingData | null,
    priorScores: Map<string, number>
  ): Set<string> {
    const shocks = new Set<string>();
    if (!trending) return shocks;

    const all = [...(trending.topBullish ?? []), ...(trending.topBearish ?? [])];
    for (const row of all) {
      const sym = row.symbol?.toUpperCase();
      if (!sym) continue;
      const score = row.normalizedScore ?? row.weightedScore ?? 0;
      const prior = priorScores.get(sym);
      if ((row.riskRatio ?? 0) >= SHOCK_RISK_RATIO) {
        shocks.add(sym);
      } else if (prior !== undefined && Math.abs(score - prior) >= SHOCK_SCORE_DELTA) {
        shocks.add(sym);
      }
      priorScores.set(sym, score);
    }
    return shocks;
  },
};
