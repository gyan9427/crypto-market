import { create } from 'zustand';
import { SupportedChain, WalletAddress, WalletEvent, Holdings } from '../types';

interface PortfolioState {
  wallets:          WalletAddress[];
  supportedChains:  SupportedChain[];
  events:           WalletEvent[];
  holdings:         Holdings | null;
  holdingsLoading:  boolean;
  isLoading:        boolean;
  error:            string | null;
  monitorSheetOpen: boolean;

  loadSupportedChains(): Promise<void>;
  loadWallets():         Promise<void>;
  loadHoldings(forceRefresh?: boolean): Promise<void>;
  addWallet(address: string, chains: string[], label?: string): Promise<void>;
  removeWallet(id: string): Promise<void>;
  loadEvents(page?: number, limit?: number): Promise<void>;
  appendEvent(event: WalletEvent): void;
  clearError(): void;
  openMonitorSheet(): void;
  closeMonitorSheet(): void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  wallets:          [],
  supportedChains:  [],
  events:           [],
  holdings:         null,
  holdingsLoading:  false,
  isLoading:        false,
  error:            null,
  monitorSheetOpen: false,

  clearError: () => set({ error: null }),
  openMonitorSheet: () => set({ monitorSheetOpen: true }),
  closeMonitorSheet: () => set({ monitorSheetOpen: false }),

  loadSupportedChains: async () => {
    try {
      const { getSupportedChains } = await import('../services/api');
      const chains = await getSupportedChains();
      set({ supportedChains: chains });
    } catch (err: any) {
      console.error('[PortfolioStore] Failed to load chains:', err);
    }
  },

  loadWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { getWallets } = await import('../services/api');
      const wallets = await getWallets();
      set({ wallets, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to load wallets' });
    }
  },

  addWallet: async (address, chains, label) => {
    set({ isLoading: true, error: null });
    try {
      const { addWallet } = await import('../services/api');
      const wallet = await addWallet(address, chains, label);
      set((state) => ({ wallets: [wallet, ...state.wallets], isLoading: false }));
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to add wallet' });
      throw err;
    }
  },

  removeWallet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { removeWallet } = await import('../services/api');
      await removeWallet(id);
      set((state) => ({
        wallets:   state.wallets.filter((w) => w.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to remove wallet' });
    }
  },

  loadHoldings: async (forceRefresh = false) => {
    set({ holdingsLoading: true });
    try {
      const { getHoldings } = await import('../services/api');
      const holdings = await getHoldings(forceRefresh);
      set({ holdings, holdingsLoading: false });
    } catch {
      set({ holdingsLoading: false });
    }
  },

  loadEvents: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const { getWalletEvents, refreshEventStatuses } = await import('../services/api');
      if (page === 1) {
        await refreshEventStatuses().catch(() => {}); // Best-effort; don't block
      }
      const events = await getWalletEvents(page, limit);
      set((state) => ({
        events:    page === 1 ? events : [...state.events, ...events],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to load events' });
    }
  },

  // Called from the WebSocket listener when a wallet_event push arrives
  appendEvent: (event: WalletEvent) => {
    set((state) => {
      // Avoid duplicates
      if (state.events.some((e) => e.id === event.id)) return state;
      // Prepend so most recent is first
      return { events: [event, ...state.events] };
    });
  },
}));
