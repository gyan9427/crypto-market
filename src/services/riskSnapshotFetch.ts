import { fetchJsonCached } from './requestCache';
import { resolveApiBaseUrl } from '../config/apiBaseUrl';
import type { RiskMeta, RiskSnapshotData } from '../types/risk';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';

interface ApiResponse<T> {
  success: boolean;
  meta?: RiskMeta;
  manifest?: { complete?: boolean; revision?: number; shardCount?: number };
  data?: T;
}

export type RiskSnapshotFetchResult = {
  meta: RiskMeta;
  data: RiskSnapshotData | null;
  manifest: ApiResponse<RiskSnapshotData>['manifest'];
};

const SNAPSHOT_URL = `${resolveApiBaseUrl()}/risk/snapshot`;

let inflight: Promise<RiskSnapshotFetchResult> | null = null;

function metaFromResponse(res: ApiResponse<RiskSnapshotData>): RiskMeta {
  return {
    revision: res.meta?.revision ?? res.data?.revision ?? 0,
    buildId: res.meta?.buildId ?? res.data?.buildId ?? '',
    buildFingerprint: res.meta?.buildFingerprint ?? res.data?.buildFingerprint ?? '',
    computedAt: res.meta?.computedAt ?? res.data?.computedAt ?? null,
    stale: res.meta?.stale ?? false,
    partial: res.meta?.partial ?? res.data?.partial ?? false,
  };
}

/**
 * Coalesced GET /risk/snapshot — one in-flight promise shared by all callers.
 * Revision comparison happens after response (client-side); no ?revision= query param.
 */
export async function fetchRiskSnapshotCoalesced(): Promise<RiskSnapshotFetchResult> {
  if (inflight) {
    incrementPerfCounter('riskSnapshotDedupe');
    return inflight;
  }

  incrementPerfCounter('riskSnapshotFetch');

  inflight = (async () => {
    const res = await fetchJsonCached<ApiResponse<RiskSnapshotData>>(SNAPSHOT_URL, {
      cacheTtlMs: 30_000,
    });
    const meta = metaFromResponse(res);
    return { meta, data: res.data ?? null, manifest: res.manifest };
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/** Test-only reset. */
export function resetRiskSnapshotInflightForTests(): void {
  inflight = null;
}
