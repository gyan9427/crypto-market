import { useCallback, useEffect, useMemo } from 'react';
import { usePortfolioStore } from '@/src/state/usePortfolioStore';
import { usePortfolioIntelligenceStore } from '@/src/state/usePortfolioIntelligenceStore';
import { useHasFeature } from '@/src/utils/features';
import { useAuthStore } from '@/src/state/useAuthStore';

interface UsePortfolioIntelligenceOptions {
  enabled?: boolean;
  autoLoad?: boolean;
}

export function usePortfolioIntelligence(options: UsePortfolioIntelligenceOptions = {}) {
  const { enabled = true, autoLoad = true } = options;
  const hasPiEngines = useHasFeature('portfolio_intelligence_engines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wallets = usePortfolioStore((s) => s.wallets);
  const walletAddresses = useMemo(() => wallets.map((w) => w.address), [wallets]);
  const hasPortfolioSource = walletAddresses.length > 0;

  const summary = usePortfolioIntelligenceStore((s) => s.summary);
  const analytics = usePortfolioIntelligenceStore((s) => s.analytics);
  const insights = usePortfolioIntelligenceStore((s) => s.insights);
  const evolution = usePortfolioIntelligenceStore((s) => s.evolution);
  const status = usePortfolioIntelligenceStore((s) => s.status);
  const mappingCoveragePct = usePortfolioIntelligenceStore((s) => s.mappingCoveragePct);
  const error = usePortfolioIntelligenceStore((s) => s.error);
  const analyticsRevision = usePortfolioIntelligenceStore((s) => s.analyticsRevision);
  const loadAll = usePortfolioIntelligenceStore((s) => s.loadAll);
  const loadEvolution = usePortfolioIntelligenceStore((s) => s.loadEvolution);
  const requestRecompute = usePortfolioIntelligenceStore((s) => s.requestRecompute);
  const reset = usePortfolioIntelligenceStore((s) => s.reset);

  const piActive = enabled && hasPiEngines && isAuthenticated && hasPortfolioSource;

  useEffect(() => {
    if (!piActive) {
      reset();
      return;
    }
    if (!autoLoad) return;
    void loadAll();
  }, [piActive, autoLoad, loadAll, reset]);

  useEffect(() => {
    if (!piActive || !autoLoad) return;
    if (status !== 'idle' || summary || analytics) return;
    void requestRecompute();
  }, [piActive, autoLoad, status, summary, analytics, requestRecompute]);

  const refresh = useCallback(async () => {
    if (!piActive) return;
    await loadAll(true);
  }, [piActive, loadAll]);

  const loadEvolutionData = useCallback(
    (days: 30 | 90 = 30) => {
      if (!piActive) return;
      void loadEvolution(days);
    },
    [piActive, loadEvolution]
  );

  return {
    enabled: piActive,
    hasPiEngines,
    summary,
    analytics,
    insights,
    evolution,
    status,
    mappingCoveragePct,
    error,
    analyticsRevision,
    refresh,
    loadEvolution: loadEvolutionData,
    requestRecompute,
  };
}