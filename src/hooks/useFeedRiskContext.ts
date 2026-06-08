import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { riskApi } from '../services/riskApi';
import { sentimentApi } from '../services/sentimentApi';
import { useRiskStore } from '../state/useRiskStore';
import { createRequestGuard, bumpGeneration } from '@/src/runtime/asyncRequestGuard';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';

export type FeedRiskContext = {
  crsBySymbol: Map<string, number>;
  crsDeltaBySymbol: Map<string, number>;
  sentimentShockSymbols: Set<string>;
  moversTopRiskSymbols: Set<string>;
  marketRegime: string | null;
  activeRiskRevision: number;
  riskStale: boolean;
};

const EMPTY: FeedRiskContext = {
  crsBySymbol: new Map(),
  crsDeltaBySymbol: new Map(),
  sentimentShockSymbols: new Set(),
  moversTopRiskSymbols: new Set(),
  marketRegime: null,
  activeRiskRevision: 0,
  riskStale: true,
};

export function useFeedRiskContext(options?: { enabled?: boolean }): FeedRiskContext {
  const enabled = options?.enabled ?? true;
  const revision = useRiskStore((s) => s.meta.revision);
  const partial = useRiskStore((s) => s.meta.partial);
  const stale = useRiskStore((s) => s.meta.stale);
  const crsBySymbolStore = useRiskStore((s) => s.crsBySymbol);
  const crsDeltaBySymbolStore = useRiskStore((s) => s.crsDeltaBySymbol);
  const snapshotRegime = useRiskStore((s) => s.snapshot?.marketRegime ?? null);

  const [moversTopRiskSymbols, setMoversTopRiskSymbols] = useState<Set<string>>(new Set());
  const [sentimentShockSymbols, setSentimentShockSymbols] = useState<Set<string>>(new Set());
  const [marketRegime, setMarketRegime] = useState<string | null>(null);
  const priorSentimentRef = useRef<Map<string, number>>(new Map());
  const enrichRevisionRef = useRef(0);

  const crsRevisionKey = `${revision}:${crsBySymbolStore.size}`;

  const crsBySymbol = useMemo(
    () =>
      new Map(
        Array.from(crsBySymbolStore.entries()).map(([sym, dto]) => [sym, dto.crs])
      ),
    [crsRevisionKey, crsBySymbolStore]
  );

  const crsDeltaBySymbol = useMemo(
    () => new Map(crsDeltaBySymbolStore),
    [crsRevisionKey, crsDeltaBySymbolStore]
  );

  const enrich = useCallback(
    async (enrichRevision: number, signal: AbortSignal) => {
      if (enrichRevision < enrichRevisionRef.current) return;
      enrichRevisionRef.current = enrichRevision;
      incrementPerfCounter('riskEnrich');

      const [moversRes, regimeRes, trending] = await Promise.all([
        riskApi.fetchMovers(),
        riskApi.fetchRegime(),
        sentimentApi.fetchTrending(),
      ]);

      if (signal.aborted || enrichRevision < enrichRevisionRef.current) return;

      const topRisk = new Set(
        (moversRes.data?.topRisk ?? []).map((c) => c.symbol.toUpperCase())
      );
      setMoversTopRiskSymbols(topRisk);

      const regime = regimeRes.data?.regime ?? snapshotRegime ?? null;
      setMarketRegime(regime);

      const shocks = sentimentApi.shockSymbolsFromTrending(
        trending,
        priorSentimentRef.current
      );
      setSentimentShockSymbols(shocks);
    },
    [snapshotRegime]
  );

  useEffect(() => {
    if (!enabled || partial || revision <= 0) return;
    const guard = createRequestGuard('feed:risk-enrich');
    void enrich(revision, guard.signal);
    return () => bumpGeneration('feed:risk-enrich');
  }, [enabled, revision, partial, enrich]);

  const stableMovers = useMemo(
    () => moversTopRiskSymbols,
    [revision, moversTopRiskSymbols.size]
  );
  const stableShocks = useMemo(
    () => sentimentShockSymbols,
    [revision, sentimentShockSymbols.size]
  );

  if (revision <= 0) {
    return EMPTY;
  }

  return {
    crsBySymbol,
    crsDeltaBySymbol,
    sentimentShockSymbols: stableShocks,
    moversTopRiskSymbols: stableMovers,
    marketRegime: marketRegime ?? snapshotRegime ?? null,
    activeRiskRevision: revision,
    riskStale: stale,
  };
}
