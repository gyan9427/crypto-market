import React from 'react';
import { useLivePricesStore } from '../state/useLivePricesStore';
import { formatPercentage } from '../utils/format';
import { colors } from '../theme/theme';

interface LiveChangeCellProps {
  symbol: string;
  baseChange24h: number;
}

/** Renders 24h change with live override; only re-renders when this symbol's data changes */
export const LiveChangeCell: React.FC<LiveChangeCellProps> = ({ symbol, baseChange24h }) => {
  const live = useLivePricesStore((state) => state.prices[symbol?.toUpperCase()]);
  const value = live?.percentChange24h ?? baseChange24h;
  const isPositive = value >= 0;
  return (
    <span
      style={{
        color: isPositive ? colors.success[500] : colors.danger[500],
        fontWeight: '600',
      }}
    >
      {formatPercentage(value)}
    </span>
  );
};
