import { API_BASE_URL } from './api';
import { fetchJsonCached } from './requestCache';
import type { RiskCoinDto, RiskMeta } from '../types/risk';

interface ApiResponse<T> {
  success: boolean;
  meta?: RiskMeta;
  manifest?: { complete?: boolean; revision?: number; shardCount?: number };
  data?: T;
  error?: string;
}

export type RiskSnapshotData = {
  revision: number;
  buildId: string;
  buildFingerprint: string;
  computedAt: string;
  partial: boolean;
  stale: boolean;
  marketRegime: string;
  universeSize: number;
  coins: RiskCoinDto[];
};

export const riskApi = {
  async fetchSnapshot(revision?: number): Promise<{
    meta: RiskMeta;
    data: RiskSnapshotData | null;
    manifest: ApiResponse<RiskSnapshotData>['manifest'];
  }> {
    const qs = revision !== undefined ? `?revision=${revision}` : '';
    const res = await fetchJsonCached<ApiResponse<RiskSnapshotData>>(
      `${API_BASE_URL}/risk/snapshot${qs}`,
      { cacheTtlMs: 30_000 }
    );
    const meta: RiskMeta = {
      revision: res.meta?.revision ?? res.data?.revision ?? 0,
      buildId: res.meta?.buildId ?? res.data?.buildId ?? '',
      buildFingerprint: res.meta?.buildFingerprint ?? res.data?.buildFingerprint ?? '',
      computedAt: res.meta?.computedAt ?? res.data?.computedAt ?? null,
      stale: res.meta?.stale ?? false,
      partial: res.meta?.partial ?? res.data?.partial ?? false,
    };
    return { meta, data: res.data ?? null, manifest: res.manifest };
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

  crsBySymbol(coins: RiskCoinDto[]): Map<string, RiskCoinDto> {
    return new Map(coins.map((c) => [c.symbol.toUpperCase(), c]));
  },
};
