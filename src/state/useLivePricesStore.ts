import { create } from 'zustand';

export interface PriceData {
  price: number;
  percentChange24h: number;
}

interface LivePricesState {
  prices: Record<string, PriceData>;
  setPrices: (prices: Record<string, PriceData>) => void;
  updatePrices: (updates: Array<{ symbol: string; price: number; percentChange24h: number }>) => void;
}

export const useLivePricesStore = create<LivePricesState>((set) => ({
  prices: {},
  setPrices: (prices) => set({ prices }),
  updatePrices: (updates) =>
    set((state) => {
      if (updates.length === 0) return state;
      const next = { ...state.prices };
      for (const u of updates) {
        if (u.symbol != null && typeof u.price === 'number') {
          next[u.symbol] = {
            price: u.price,
            percentChange24h: typeof u.percentChange24h === 'number' ? u.percentChange24h : 0,
          };
        }
      }
      return { prices: next };
    }),
}));
