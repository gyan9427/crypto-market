import { useCallback, useEffect, useRef, useState } from 'react';
import { riskApi } from '../services/riskApi';
import { sentimentApi } from '../services/sentimentApi';
import { useRiskStore } from '../state/useRiskStore';

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

export function useFeedRiskContext(): FeedRiskContext {
  const meta = useRiskStore((s) => s.meta);
  const crsBySymbolStore = useRiskStore((s) => s.crsBySymbol);
  const crsDeltaBySymbol = useRiskStore((s) => s.crsDeltaBySymbol);
  const snapshot = useRiskStore((s) => s.snapshot);

  const [moversTopRiskSymbols, setMoversTopRiskSymbols] = useState<Set<string>>(new Set());
  const [sentimentShockSymbols, setSentimentShockSymbols] = useState<Set<string>>(new Set());
  const [marketRegime, setMarketRegime] = useState<string | null>(null);
  const priorSentimentRef = useRef<Map<string, number>>(new Map());
  const enrichRevisionRef = useRef(0);

  const crsBySymbol = useRef(new Map<string, number>());
  crsBySymbol.current = new Map(
    Array.from(crsBySymbolStore.entries()).map(([sym, dto]) => [sym, dto.crs])
  );

  const enrich = useCallback(async (revision: number) => {
    if (revision < enrichRevisionRef.current) return;
    enrichRevisionRef.current = revision;

    const [moversRes, regimeRes, trending] = await Promise.all([
      riskApi.fetchMovers(),
      riskApi.fetchRegime(),
      sentimentApi.fetchTrending(),
    ]);

    if (revision < enrichRevisionRef.current) return;

    const topRisk = new Set(
      (moversRes.data?.topRisk ?? []).map((c) => c.symbol.toUpperCase())
    );
    setMoversTopRiskSymbols(topRisk);

    const regime = regimeRes.data?.regime ?? snapshot?.marketRegime ?? null;
    setMarketRegime(regime);

    const shocks = sentimentApi.shockSymbolsFromTrending(
      trending,
      priorSentimentRef.current
    );
    setSentimentShockSymbols(shocks);
  }, [meta.stale, snapshot?.marketRegime]);

  useEffect(() => {
    if (meta.partial || meta.revision <= 0) return;
    void enrich(meta.revision);
  }, [meta.revision, meta.partial, enrich]);

  if (meta.revision <= 0) {
    return EMPTY;
  }

  return {
    crsBySymbol: crsBySymbol.current,
    crsDeltaBySymbol,
    sentimentShockSymbols,
    moversTopRiskSymbols,
    marketRegime: marketRegime ?? snapshot?.marketRegime ?? null,
    activeRiskRevision: meta.revision,
    riskStale: meta.stale,
  };
}
