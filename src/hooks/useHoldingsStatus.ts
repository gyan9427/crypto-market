import { useMemo } from 'react';
import { usePortfolioStore } from '../state/usePortfolioStore';

/**
 * Whether the user holds the asset by ticker (matches portfolio positions).
 */
export function useHoldingsStatus(symbol: string): { isHeld: boolean; quantity?: number } {
  const positions = usePortfolioStore((s) => s.holdings?.positions);
  return useMemo(() => {
    const s = (symbol || '').trim().toUpperCase();
    if (!s || !positions?.length) return { isHeld: false };
    const hit = positions.find((p) => (p.symbol || '').trim().toUpperCase() === s);
    if (!hit) return { isHeld: false };
    const qty = typeof hit.quantity === 'number' && Number.isFinite(hit.quantity) ? hit.quantity : undefined;
    return { isHeld: true, quantity: qty };
  }, [positions, symbol]);
}
