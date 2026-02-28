import React from 'react';
import { useLivePricesStore } from '../state/useLivePricesStore';
import { formatPrice } from '../utils/format';

interface LivePriceCellProps {
  symbol: string;
  basePrice: number;
}

/** Renders price with live override; only re-renders when this symbol's price changes */
export const LivePriceCell: React.FC<LivePriceCellProps> = ({ symbol, basePrice }) => {
  const live = useLivePricesStore((state) => state.prices[symbol?.toUpperCase()]);
  const price = live?.price ?? basePrice;
  return <span style={{ fontWeight: '600' }}>{formatPrice(price)}</span>;
};
