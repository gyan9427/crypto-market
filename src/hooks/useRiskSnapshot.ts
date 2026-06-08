import { useCallback } from 'react';
import type { RiskSnapshotData } from '../types/risk';
import { fetchRiskSnapshotCoalesced } from '../services/riskSnapshotFetch';
import type { RiskMeta } from '../types/risk';
import { usePollingEffect } from './usePollingEffect';
import { useRiskStore } from '../state/useRiskStore';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';

export type RiskSnapshotState = {
  meta: RiskMeta;
  snapshot: RiskSnapshotData | null;
  loading: boolean;
};

type LoadSource = 'poll' | 'ws' | 'manual';

/**
 * Hydrates CRS snapshot into useRiskStore with stable callbacks (no revision deps).
 * Polling is the sole lifecycle owner for initial + interval fetches.
 */
export function useRiskSnapshot(options?: { enabled?: boolean; pollMs?: number }) {
  const enabled = options?.enabled ?? true;
  const pollMs = options?.pollMs ?? 120_000;

  const meta = useRiskStore((s) => s.meta);
  const snapshot = useRiskStore((s) => s.snapshot);

  const load = useCallback(async (source: LoadSource = 'manual') => {
    if (!enabled) return;

    if (source === 'poll') incrementPerfCounter('riskSnapshotPoll');
    if (source === 'ws') incrementPerfCounter('riskSnapshotWsRefresh');

    try {
      const { meta: incoming, data, manifest } = await fetchRiskSnapshotCoalesced();
      if (manifest?.complete === false) return;

      const currentRevision = useRiskStore.getState().meta.revision;
      if (incoming.partial || incoming.revision < currentRevision) return;
      if (!data) return;
      if (incoming.revision === currentRevision) return;

      useRiskStore.getState().setSnapshot(incoming, data);
    } catch {
      // keep last-good snapshot in store
    }
  }, [enabled]);

  usePollingEffect(
    () => load('poll'),
    [enabled],
    { enabled, intervalMs: pollMs, immediate: true }
  );

  const onWsRevision = useCallback(
    (incomingRevision: number) => {
      if (!enabled) return;
      const current = useRiskStore.getState().meta.revision;
      if (!Number.isFinite(incomingRevision) || incomingRevision <= current) return;
      void load('ws');
    },
    [enabled, load]
  );

  return {
    revision: meta.revision,
    meta,
    snapshot,
    loading: meta.revision <= 0 && snapshot === null,
    reload: () => load('manual'),
    onWsRevision,
  };
}
