import { create } from 'zustand';
import {
  clearPortfolioAnalyticsCache,
  fetchPortfolioAnalytics,
  fetchPortfolioEvolution,
  fetchPortfolioInsights,
  fetchPortfolioSummary,
  requestPortfolioRecompute,
  type PiInsight,
  type PortfolioAnalyticsPayload,
  type PortfolioEvolutionPoint,
  type PortfolioSummaryDto,
} from '@/src/services/portfolioIntelligenceApi';

export type PortfolioIntelligenceStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'partial'
  | 'stale'
  | 'error';

interface PortfolioIntelligenceState {
  analytics: PortfolioAnalyticsPayload | null;
  summary: PortfolioSummaryDto | null;
  insights: PiInsight[];
  evolution: PortfolioEvolutionPoint[];
  analyticsRevision: number;
  ingestRevision: number;
  status: PortfolioIntelligenceStatus;
  mappingCoveragePct: number | null;
  lastFetchedAt: number | null;
  error: string | null;
  recomputeRequested: boolean;

  loadAnalytics: (force?: boolean) => Promise<void>;
  loadSummary: () => Promise<void>;
  loadInsights: () => Promise<void>;
  loadEvolution: (days?: 30 | 90) => Promise<void>;
  loadAll: (force?: boolean) => Promise<void>;
  invalidate: (opts?: { refetch?: boolean }) => void;
  requestRecompute: () => Promise<boolean>;
  reset: () => void;
}

const INITIAL_STATE = {
  analytics: null as PortfolioAnalyticsPayload | null,
  summary: null as PortfolioSummaryDto | null,
  insights: [] as PiInsight[],
  evolution: [] as PortfolioEvolutionPoint[],
  analyticsRevision: 0,
  ingestRevision: 0,
  status: 'idle' as PortfolioIntelligenceStatus,
  mappingCoveragePct: null as number | null,
  lastFetchedAt: null as number | null,
  error: null as string | null,
  recomputeRequested: false,
};

function deriveStatus(
  partial: boolean,
  stale: boolean,
  hasData: boolean
): PortfolioIntelligenceStatus {
  if (stale) return 'stale';
  if (!hasData) return 'idle';
  if (partial) return 'partial';
  return 'ready';
}

export const usePortfolioIntelligenceStore = create<PortfolioIntelligenceState>((set, get) => ({
  ...INITIAL_STATE,

  loadAnalytics: async (force = false) => {
    set({ status: get().status === 'idle' ? 'loading' : get().status, error: null });
    try {
      const analytics = await fetchPortfolioAnalytics({ force });
      if (!analytics) {
        set({
          analytics: null,
          status: get().summary ? deriveStatus(!!get().summary?.partial, false, true) : 'idle',
          error: null,
        });
        return;
      }
      set({
        analytics,
        analyticsRevision: get().summary?.analyticsRevision ?? get().analyticsRevision,
        mappingCoveragePct: analytics.telemetry?.mappingCoveragePct ?? null,
        status: deriveStatus(analytics.partial, get().status === 'stale', true),
        lastFetchedAt: Date.now(),
        error: null,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to load analytics',
      });
    }
  },

  loadSummary: async () => {
    const prevStatus = get().status;
    if (prevStatus === 'idle') set({ status: 'loading', error: null });
    try {
      const summary = await fetchPortfolioSummary();
      if (!summary) {
        if (prevStatus === 'idle' && !get().analytics) {
          set({ status: 'idle' });
        }
        return;
      }
      set({
        summary,
        analyticsRevision: summary.analyticsRevision,
        status: deriveStatus(summary.partial, get().status === 'stale', true),
        lastFetchedAt: Date.now(),
        error: null,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to load summary',
      });
    }
  },

  loadInsights: async () => {
    try {
      const res = await fetchPortfolioInsights();
      if (!res) return;
      set({
        insights: res.insights ?? [],
        status: deriveStatus(!!res.partial, get().status === 'stale', get().summary != null || get().analytics != null),
        lastFetchedAt: Date.now(),
      });
    } catch {
      /* keep last insights */
    }
  },

  loadEvolution: async (days = 90) => {
    try {
      const res = await fetchPortfolioEvolution(days === 90 ? 90 : 30);
      if (!res) return;
      set({ evolution: res.points ?? [] });
    } catch {
      /* keep last evolution */
    }
  },

  loadAll: async (force = false) => {
    set({ status: 'loading', error: null });
    await Promise.all([
      get().loadSummary(),
      get().loadAnalytics(force),
      get().loadInsights(),
      get().loadEvolution(90),
    ]);
    const state = get();
    if (state.status === 'loading') {
      set({
        status: state.summary || state.analytics ? deriveStatus(
          !!(state.summary?.partial || state.analytics?.partial),
          false,
          true
        ) : 'idle',
      });
    }
  },

  invalidate: (opts) => {
    clearPortfolioAnalyticsCache();
    const state = get();
    set({
      status: state.summary || state.analytics ? 'stale' : 'idle',
    });
    if (opts?.refetch !== false) {
      void get().loadAll(true);
    }
  },

  requestRecompute: async () => {
    if (get().recomputeRequested) return false;
    set({ recomputeRequested: true });
    const ok = await requestPortfolioRecompute();
    if (!ok) set({ recomputeRequested: false });
    return ok;
  },

  reset: () => {
    clearPortfolioAnalyticsCache();
    set({ ...INITIAL_STATE });
  },
}));
