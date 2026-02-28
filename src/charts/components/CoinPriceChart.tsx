import React from 'react';
import { ChartContainer } from './ChartContainer';
import { PriceLineChart } from './PriceLineChart';
import { PriceAreaChart } from './PriceAreaChart';
import { useKlines } from '../hooks/useKlines';
import { CHART_HEIGHT } from '../constants';
import { colors } from '../../theme/theme';
import type { ChartVariant, KlineInterval } from '../types';

interface CoinPriceChartProps {
  symbol: string;
  interval?: KlineInterval;
  variant?: ChartVariant;
}

export const CoinPriceChart: React.FC<CoinPriceChartProps> = ({
  symbol,
  interval = '1h',
  variant = 'area',
}) => {
  const { chartData, loading, error, refetch } = useKlines(symbol, interval, {
    enabled: !!symbol.trim(),
  });

  const ChartComponent = variant === 'line' ? PriceLineChart : PriceAreaChart;

  return (
    <ChartContainer
      title={`${symbol} Price`}
      loading={loading}
      error={error}
      onRetry={refetch}
    >
      <ChartComponent
        data={chartData}
        height={CHART_HEIGHT}
        color={colors.primary[500]}
        showDataPoints={false}
      />
    </ChartContainer>
  );
};
