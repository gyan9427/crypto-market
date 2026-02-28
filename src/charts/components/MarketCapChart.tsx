import React from 'react';
import { ChartContainer } from './ChartContainer';
import { PriceAreaChart } from './PriceAreaChart';
import { useKlines } from '../hooks/useKlines';
import { DEFAULT_MARKET_SYMBOL, CHART_HEIGHT } from '../constants';
import { colors } from '../../theme/theme';

export const MarketCapChart: React.FC = () => {
  const { chartData, loading, error, refetch } = useKlines(DEFAULT_MARKET_SYMBOL, '1h');

  return (
    <ChartContainer
      title="Market Cap"
      loading={loading}
      error={error}
      onRetry={refetch}
    >
      <PriceAreaChart
        data={chartData}
        height={CHART_HEIGHT}
        color={colors.primary[500]}
        showDataPoints={false}
      />
    </ChartContainer>
  );
};
