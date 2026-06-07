import { API_BASE_URL } from './api';
import { fetchJsonCached } from './requestCache';
import { fetchRiskSnapshotCoalesced } from './riskSnapshotFetch';
import type { RiskCoinDto, RiskMeta, RiskSnapshotData } from '../types/risk';

interface ApiResponse<T> {
  success: boolean;
  meta?: RiskMeta;
  manifest?: { complete?: boolean; revision?: number; shardCount?: number };
  data?: T;
  error?: string;
}

export type { RiskSnapshotData } from '../types/risk';

export type RiskMoversData = {
  generatedAt: string;
  revision: number;
  topRisk: RiskCoinDto[];
  bottomRisk: RiskCoinDto[];
};

export type RiskRegimeData = {
  regime: string;
  confidence?: number;
  drivers?: string[];
  revision?: number;
  computedAt?: string;
};

export const riskApi = {
  /** Coalesced GET /risk/snapshot — revision is compared client-side after response. */
  async fetchSnapshot(): Promise<{
    meta: RiskMeta;
    data: RiskSnapshotData | null;
    manifest: ApiResponse<RiskSnapshotData>['manifest'];
  }> {
    return fetchRiskSnapshotCoalesced();
  },

  async fetchCoin(symbol: string): Promise<{ meta: RiskMeta; coin: RiskCoinDto | null }> {
    const res = await fetchJsonCached<ApiResponse<RiskCoinDto>>(
      `${API_BASE_URL}/risk/coins/${encodeURIComponent(symbol)}`,
      { cacheTtlMs: 60_000 }
    );
    const meta: RiskMeta = {
      revision: res.meta?.revision ?? 0,
      buildId: res.meta?.buildId ?? '',
      buildFingerprint: res.meta?.buildFingerprint ?? '',
      computedAt: res.meta?.computedAt ?? null,
      stale: res.meta?.stale ?? false,
      partial: res.meta?.partial ?? false,
    };
    return { meta, coin: res.data ?? null };
  },

  async fetchMovers(): Promise<{ meta: RiskMeta; data: RiskMoversData | null }> {
    try {
      const res = await fetchJsonCached<ApiResponse<RiskMoversData>>(
        `${API_BASE_URL}/risk/movers`,
        { cacheTtlMs: 90_000 }
      );
      const meta: RiskMeta = {
        revision: res.meta?.revision ?? res.data?.revision ?? 0,
        buildId: res.meta?.buildId ?? '',
        buildFingerprint: res.meta?.buildFingerprint ?? '',
        computedAt: res.meta?.computedAt ?? res.data?.generatedAt ?? null,
        stale: res.meta?.stale ?? false,
        partial: res.meta?.partial ?? false,
      };
      return { meta, data: res.data ?? null };
    } catch {
      return {
        meta: {
          revision: 0,
          buildId: '',
          buildFingerprint: '',
          computedAt: null,
          stale: true,
          partial: false,
        },
        data: null,
      };
    }
  },

  async fetchRegime(): Promise<{ meta: RiskMeta; data: RiskRegimeData | null }> {
    try {
      const res = await fetchJsonCached<ApiResponse<RiskRegimeData>>(
        `${API_BASE_URL}/risk/regime`,
        { cacheTtlMs: 90_000 }
      );
      const meta: RiskMeta = {
        revision: res.meta?.revision ?? res.data?.revision ?? 0,
        buildId: res.meta?.buildId ?? '',
        buildFingerprint: res.meta?.buildFingerprint ?? '',
        computedAt: res.meta?.computedAt ?? res.data?.computedAt ?? null,
        stale: res.meta?.stale ?? false,
        partial: res.meta?.partial ?? false,
      };
      return { meta, data: res.data ?? null };
    } catch {
      return {
        meta: {
          revision: 0,
          buildId: '',
          buildFingerprint: '',
          computedAt: null,
          stale: true,
          partial: false,
        },
        data: null,
      };
    }
  },

  crsBySymbol(coins: RiskCoinDto[]): Map<string, RiskCoinDto> {
    return new Map(coins.map((c) => [c.symbol.toUpperCase(), c]));
  },
};
