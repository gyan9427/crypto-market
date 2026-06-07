import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  startTransition,
  type ReactNode,
} from 'react';
import { useFeedRiskContext, type FeedRiskContext } from '@/src/hooks/useFeedRiskContext';
import { fetchPortfolioContextCached } from '@/src/services/piApi';
import { useHasFeature } from '@/src/utils/features';
import { useConsentStore, canUsePersonalization } from '@/src/privacy/consentStore';
import { bumpGeneration, createRequestGuard } from '@/src/runtime/asyncRequestGuard';
import { enqueueBackgroundTask } from '@/src/runtime/backgroundTaskQueue';
import { cacheRegistry } from '@/src/runtime/cacheRegistry';

export type PiFeedContext = {
  heldSymbols: Set<string>;
  heldWeightBySymbol: Map<string, number>;
  narrativeVector: Map<string, number>;
  convictionVector: Map<string, number>;
  topThemes: string[];
  portfolioAnalyticsRevision: number;
  stale: boolean;
};

const EMPTY_PI: PiFeedContext = {
  heldSymbols: new Set(),
  heldWeightBySymbol: new Map(),
  narrativeVector: new Map(),
  convictionVector: new Map(),
  topThemes: [],
  portfolioAnalyticsRevision: 0,
  stale: false,
};

type PiAction =
  | { type: 'SET'; payload: NonNullable<Awaited<ReturnType<typeof fetchPortfolioContextCached>>> }
  | { type: 'CLEAR' };

function piReducer(_state: PiFeedContext, action: PiAction): PiFeedContext {
  if (action.type === 'CLEAR') return { ...EMPTY_PI };
  const ctx = action.payload;
  return {
    heldSymbols: new Set(ctx.heldSymbols.map((s) => s.toUpperCase())),
    heldWeightBySymbol: new Map(
      Object.entries(ctx.weightBySymbol).map(([k, v]) => [k.toUpperCase(), v])
    ),
    narrativeVector: ctx.narrativeVector
      ? new Map(Object.entries(ctx.narrativeVector).map(([k, v]) => [k.toUpperCase(), v]))
      : new Map(),
    convictionVector: ctx.convictionVector
      ? new Map(Object.entries(ctx.convictionVector).map(([k, v]) => [k.toUpperCase(), v]))
      : new Map(),
    topThemes: ctx.topThemes ?? [],
    portfolioAnalyticsRevision: ctx.analyticsRevision,
    stale: ctx.stale ?? false,
  };
}

type RiskContextValue = FeedRiskContext;
type PiContextValue = { pi: PiFeedContext; piRevision: number };
type ConsentContextValue = { personalizationEnabled: boolean };

const RiskCtx = createContext<RiskContextValue | null>(null);
const PiCtx = createContext<PiContextValue | null>(null);
const ConsentCtx = createContext<ConsentContextValue | null>(null);

export function FeedContextProvider({ children }: { children: ReactNode }): React.ReactElement {
  const risk = useFeedRiskContext();
  const hasPiContext = useHasFeature('portfolio_intelligence_context_api');
  const personalizationEnabled = useConsentStore(
    (s) => s.hydrated && s.consentDecided && s.personalizationConsent
  );
  const [pi, dispatchPi] = useReducer(piReducer, EMPTY_PI);
  const [piRevision, setPiRevision] = React.useState(0);

  useEffect(() => {
    return () => {
      bumpGeneration('feed:pi');
      bumpGeneration('feed:risk-enrich');
    };
  }, []);

  useEffect(() => {
    if (!personalizationEnabled) {
      dispatchPi({ type: 'CLEAR' });
      return;
    }
    if (!hasPiContext) return;

    const guard = createRequestGuard('feed:pi');

    enqueueBackgroundTask('normal', () =>
      fetchPortfolioContextCached({ signal: guard.signal })
        .then((ctx) => {
          if (guard.isStale() || !ctx) return;
          startTransition(() => {
            dispatchPi({ type: 'SET', payload: ctx });
            setPiRevision((r) => r + 1);
          });
        })
        .catch(() => {
          /* stale-if-error — keep last PI */
        })
    );

    return () => bumpGeneration('feed:pi');
  }, [hasPiContext, personalizationEnabled]);

  useEffect(() => {
    cacheRegistry.register('feed:pi', () => dispatchPi({ type: 'CLEAR' }));
  }, []);

  const riskValue = useMemo(() => risk, [
    risk.activeRiskRevision,
    risk.riskStale,
    risk.marketRegime,
    risk.crsBySymbol.size,
    risk.crsDeltaBySymbol.size,
    risk.sentimentShockSymbols.size,
    risk.moversTopRiskSymbols.size,
  ]);

  const piValue = useMemo(
    () => ({ pi, piRevision }),
    [pi, piRevision]
  );

  const consentValue = useMemo(
    () => ({ personalizationEnabled }),
    [personalizationEnabled]
  );

  return (
    <RiskCtx.Provider value={riskValue}>
      <PiCtx.Provider value={piValue}>
        <ConsentCtx.Provider value={consentValue}>{children}</ConsentCtx.Provider>
      </PiCtx.Provider>
    </RiskCtx.Provider>
  );
}

export function useFeedRiskContextShared(): FeedRiskContext | null {
  return useContext(RiskCtx);
}

export function useFeedPiContextShared(): PiContextValue | null {
  return useContext(PiCtx);
}

export function useFeedPersonalizationGate(): boolean {
  const ctx = useContext(ConsentCtx);
  if (!ctx) return canUsePersonalization();
  return ctx.personalizationEnabled;
}

export function useFeedContextAvailable(): boolean {
  return useContext(RiskCtx) != null;
}
