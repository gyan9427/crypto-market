import { create } from 'zustand';
import { SupportedChain, WalletAddress, WalletEvent, Holdings, TxStatus } from '../types';
import type {
  PortfolioRequestContext,
  PortfolioSessionMode,
  PortfolioTriggerReason,
} from '../services/api';

const MANUAL_REFRESH_COOLDOWN_MS = 30000;
const RECOVERY_COOLDOWN_MS = 45000;

interface PortfolioApiOptions {
  triggerReason?: PortfolioTriggerReason;
  modeOverride?: PortfolioSessionMode;
}

interface PortfolioStatusUpdatePayload {
  eventId: string;
  txStatus: TxStatus;
  explorerUrl?: string;
}

interface PortfolioState {
  wallets: WalletAddress[];
  supportedChains: SupportedChain[];
  supportedChainsError: string | null;
  statusRefreshWarning: string | null;
  events: WalletEvent[];
  holdings: Holdings | null;
  holdingsLoading: boolean;
  isLoading: boolean;
  error: string | null;
  monitorSheetOpen: boolean;
  sessionMode: PortfolioSessionMode;
  streamHealthy: boolean;
  lastHeartbeatAt: number | null;
  lastManualRefreshAt: number;
  lastRecoveryAt: number;

  setSessionMode(mode: PortfolioSessionMode): void;
  setStreamHealthy(healthy: boolean): void;
  markStreamHeartbeat(): void;

  loadSupportedChains(): Promise<void>;
  loadWallets(): Promise<void>;
  loadHoldings(forceRefresh?: boolean, options?: PortfolioApiOptions): Promise<void>;
  addWallet(address: string, chains: string[], label?: string): Promise<void>;
  removeWallet(id: string): Promise<void>;
  loadEvents(page?: number, limit?: number, options?: PortfolioApiOptions): Promise<void>;
  runRecoverySync(limit?: number): Promise<void>;

  appendEvent(event: WalletEvent): void;
  applyStatusUpdate(update: PortfolioStatusUpdatePayload): void;
  applyHoldingsDelta(holdings: Holdings): void;

  clearError(): void;
  openMonitorSheet(): void;
  closeMonitorSheet(): void;
  canRunManualRefresh(nowMs?: number): boolean;
  markManualRefresh(): void;
}

function resolveContext(state: PortfolioState, options?: PortfolioApiOptions): Required<PortfolioRequestContext> {
  return {
    mode: options?.modeOverride ?? state.sessionMode,
    triggerReason: options?.triggerReason ?? 'ui_default',
  };
}

function shouldBlockLiveApi(context: Required<PortfolioRequestContext>): boolean {
  return context.mode === 'live' && context.triggerReason !== 'manual_refresh';
}

function sortEventsDesc(events: WalletEvent[]): WalletEvent[] {
  return [...events].sort((a, b) => {
    const aTs = new Date(a.aggregatedAt).getTime();
    const bTs = new Date(b.aggregatedAt).getTime();
    return bTs - aTs;
  });
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  wallets: [],
  supportedChains: [],
  supportedChainsError: null,
  statusRefreshWarning: null,
  events: [],
  holdings: null,
  holdingsLoading: false,
  isLoading: false,
  error: null,
  monitorSheetOpen: false,
  sessionMode: 'bootstrap',
  streamHealthy: false,
  lastHeartbeatAt: null,
  lastManualRefreshAt: 0,
  lastRecoveryAt: 0,

  setSessionMode: (mode) => {
    set({ sessionMode: mode });
  },

  setStreamHealthy: (healthy) => {
    set({ streamHealthy: healthy });
    if (!healthy) {
      const mode = get().sessionMode;
      if (mode === 'live') set({ sessionMode: 'degraded' });
    }
  },

  markStreamHeartbeat: () => {
    set({ streamHealthy: true, lastHeartbeatAt: Date.now() });
  },

  clearError: () => set({ error: null, statusRefreshWarning: null }),
  openMonitorSheet: () => set({ monitorSheetOpen: true }),
  closeMonitorSheet: () => set({ monitorSheetOpen: false }),

  canRunManualRefresh: (nowMs = Date.now()) => nowMs - get().lastManualRefreshAt >= MANUAL_REFRESH_COOLDOWN_MS,

  markManualRefresh: () => {
    set({ lastManualRefreshAt: Date.now() });
  },

  loadSupportedChains: async () => {
    set({ supportedChainsError: null });
    try {
      const { getSupportedChains } = await import('../services/api');
      const chains = await getSupportedChains();
      if (chains.length === 0) {
        set({
          supportedChains: [],
          supportedChainsError: 'Unable to load supported chains. Please try again.',
        });
        return;
      }
      set({ supportedChains: chains, supportedChainsError: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load supported chains. Please try again.';
      console.error('[PortfolioStore] Failed to load chains:', err);
      set({
        supportedChains: [],
        supportedChainsError: message,
      });
    }
  },

  loadWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { getWallets } = await import('../services/api');
      const wallets = await getWallets();
      set({ wallets, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load wallets';
      set({ isLoading: false, error: message });
    }
  },

  addWallet: async (address, chains, label) => {
    set({ isLoading: true, error: null });
    try {
      const { addWallet } = await import('../services/api');
      const wallet = await addWallet(address, chains, label);
      set((state) => ({ wallets: [wallet, ...state.wallets], isLoading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add wallet';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  removeWallet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { removeWallet } = await import('../services/api');
      await removeWallet(id);
      set((state) => ({
        wallets: state.wallets.filter((w) => w.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove wallet';
      set({ isLoading: false, error: message });
    }
  },

  loadHoldings: async (forceRefresh = false, options) => {
    const context = resolveContext(get(), options);
    if (shouldBlockLiveApi(context)) return;

    set({ holdingsLoading: true });
    try {
      const { getHoldingsWithContext } = await import('../services/api');
      const holdings = await getHoldingsWithContext(forceRefresh, context);
      set({ holdings, holdingsLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load holdings';
      if (!message.toLowerCase().includes('blocked in live mode')) {
        set({ error: message });
      }
      set({ holdingsLoading: false });
    }
  },

  loadEvents: async (page = 1, limit = 20, options) => {
    const context = resolveContext(get(), options);
    if (page <= 1 && shouldBlockLiveApi(context)) return;

    set({ isLoading: true, error: null, statusRefreshWarning: null });
    try {
      const { getWalletEvents, refreshEventStatuses } = await import('../services/api');
      if (page === 1 && context.mode !== 'live') {
        try {
          await refreshEventStatuses(context);
        } catch (firstErr) {
          // Retry once to reduce stale "pending" statuses from transient RPC/provider hiccups.
          await new Promise((resolve) => setTimeout(resolve, 350));
          try {
            await refreshEventStatuses(context);
          } catch (secondErr) {
            console.warn('[PortfolioStore] refreshEventStatuses failed after retry', {
              firstError: firstErr instanceof Error ? firstErr.message : String(firstErr),
              secondError: secondErr instanceof Error ? secondErr.message : String(secondErr),
              context,
            });
            set({
              statusRefreshWarning: 'Transaction status updates are temporarily delayed. Explorer may show newer status.',
            });
          }
        }
      }
      const events = await getWalletEvents(page, limit, context);
      set((state) => ({
        events: page === 1 ? sortEventsDesc(events) : sortEventsDesc([...state.events, ...events]),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet events';
      if (!message.toLowerCase().includes('blocked in live mode')) {
        set({ isLoading: false, error: message });
      } else {
        set({ isLoading: false });
      }
    }
  },

  runRecoverySync: async (limit = 100) => {
    const now = Date.now();
    if (now - get().lastRecoveryAt < RECOVERY_COOLDOWN_MS) return;

    set({
      sessionMode: 'recovery',
      lastRecoveryAt: now,
      streamHealthy: false,
    });

    await Promise.all([
      get().loadWallets(),
      get().loadEvents(1, limit, { modeOverride: 'recovery', triggerReason: 'reconnect_recovery' }),
      get().loadHoldings(true, { modeOverride: 'recovery', triggerReason: 'reconnect_recovery' }),
    ]);

    set({ sessionMode: 'bootstrap' });
  },

  appendEvent: (event) => {
    set((state) => {
      if (state.events.some((e) => e.id === event.id)) return state;
      const next = sortEventsDesc([event, ...state.events]);
      return { events: next };
    });
  },

  applyStatusUpdate: (update) => {
    set((state) => {
      const idx = state.events.findIndex((e) => e.id === update.eventId);
      if (idx < 0) return state;
      const next = [...state.events];
      const curr = next[idx];
      next[idx] = {
        ...curr,
        activity: {
          ...(curr.activity ?? {}),
          txStatus: update.txStatus,
          explorerUrl: update.explorerUrl ?? curr.activity?.explorerUrl,
        },
      };
      return { events: next };
    });
  },

  applyHoldingsDelta: (holdings) => {
    set({ holdings, holdingsLoading: false });
  },
}));
