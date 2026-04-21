import { useMemo } from 'react';
import { useMarketPriceStream } from './useMarketPriceStream';

export interface LivePriceEntry {
  price: number;
  percentChange24h: number;
}

/**
 * Map view of live quotes for the given symbols (shared socket via useMarketPriceStream).
 */
export function useMarketPrices(symbols: string[]): { prices: Map<string, LivePriceEntry> } {
  const { quotes } = useMarketPriceStream(symbols, { enabled: symbols.length > 0 });
  const prices = useMemo(() => {
    const m = new Map<string, LivePriceEntry>();
    for (const [k, v] of Object.entries(quotes)) {
      m.set(k, { price: v.price, percentChange24h: v.percentChange24h });
    }
    return m;
  }, [quotes]);
  return { prices };
}
