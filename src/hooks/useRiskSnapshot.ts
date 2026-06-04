import { useCallback, useEffect, useRef, useState } from 'react';
import { riskApi, type RiskSnapshotData } from '../services/riskApi';
import type { RiskMeta } from '../types/risk';
import { useRiskRevision } from './useRiskRevision';
import { usePollingEffect } from './usePollingEffect';
import { useRiskStore } from '../state/useRiskStore';

export type RiskSnapshotState = {
  meta: RiskMeta;
  snapshot: RiskSnapshotData | null;
  crsBySymbol: Map<string, import('../types/risk').RiskCoinDto>;
  loading: boolean;
};

const EMPTY_META: RiskMeta = {
  revision: 0,
  buildId: '',
  buildFingerprint: '',
  computedAt: null,
  stale: true,
  partial: false,
};

export function useRiskSnapshot(options?: { enabled?: boolean; pollMs?: number }) {
  const enabled = options?.enabled ?? true;
  const pollMs = options?.pollMs ?? 120_000;
  const { revision, meta, applyMeta, applyWsRevision } = useRiskRevision();
  const [snapshot, setSnapshot] = useState<RiskSnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const load = useCallback(async () => {
    if (!enabled || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { meta: incoming, data, manifest } = await riskApi.fetchSnapshot(revision || undefined);
      if (manifest && manifest.complete === false) return;
      if (!applyMeta(incoming)) return;
      if (data) {
        setSnapshot(data);
        useRiskStore.getState().setSnapshot(incoming, data);
      }
    } catch {
      // keep last-good
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [enabled, revision, applyMeta]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  usePollingEffect(load, [load], { enabled, intervalMs: pollMs });

  const onWsRevision = useCallback(
    (incomingRevision: number) => {
      if (!applyWsRevision(incomingRevision)) return;
      void load();
    },
    [applyWsRevision, load]
  );

  const crsBySymbol = snapshot ? riskApi.crsBySymbol(snapshot.coins) : new Map();

  return {
    revision,
    meta: meta ?? EMPTY_META,
    snapshot,
    crsBySymbol,
    loading,
    reload: load,
    onWsRevision,
  };
}
