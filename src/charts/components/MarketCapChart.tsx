import React, { useState, useCallback, useMemo } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { ChartContainer } from './ChartContainer';
import { ChartWebView } from '../webview/ChartWebView';
import { FullChartModal } from './FullChartModal';
import { PriceAreaChart } from './PriceAreaChart';
import { useKlinesInfinite } from '../hooks/useKlinesInfinite';
import { useChartTheme } from '../hooks/useChartTheme';
import { useMarketPrices } from '../../hooks/useMarketPrices';
import { klinesToLineData } from '../transform';
import { DEFAULT_MARKET_SYMBOL } from '../constants';
import { colors } from '../../theme/theme';

const COMPACT_CHART_HEIGHT = 140;
const isWeb = Platform.OS === 'web';

export const MarketCapChart: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const theme = useChartTheme();
  const { prices } = useMarketPrices([DEFAULT_MARKET_SYMBOL]);

  const {
    data,
    candlestickData,
    volumeData,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    loadingMore,
  } = useKlinesInfinite(DEFAULT_MARKET_SYMBOL, '1h', { limit: 300 });

  const chartData = useMemo(
    () => klinesToLineData(data, 'close', '1h'),
    [data]
  );

  const liveCandleUpdate = useMemo(() => {
    const p = prices.get(DEFAULT_MARKET_SYMBOL);
    if (!p || candlestickData.length === 0) return undefined;
    const last = candlestickData[candlestickData.length - 1];
    return {
      close: p.price,
      high: Math.max(last.high, p.price),
      low: Math.min(last.low, p.price),
    };
  }, [prices, candlestickData]);

  const handleLoadHistorical = useCallback(
    (from: string, to: string) => {
      if (!hasMore || loadingMore) return;
      loadMore(new Date(from), new Date(to));
    },
    [loadMore, hasMore, loadingMore]
  );

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  const renderChart = () => {
    if (isWeb) {
      return (
        <PriceAreaChart
          data={chartData}
          height={COMPACT_CHART_HEIGHT}
          color={colors.primary[500]}
          showDataPoints={false}
          flush
        />
      );
    }
    return candlestickData.length > 0 ? (
      <ChartWebView
        candlestickData={candlestickData}
        volumeData={volumeData}
        theme={theme}
        viewMode="candlestick"
        indicators={{ ema: { period: 20 } }}
        showVolume={false}
        onLoadHistorical={handleLoadHistorical}
        liveCandleUpdate={liveCandleUpdate}
        style={{ height: COMPACT_CHART_HEIGHT }}
      />
    ) : null;
  };

  return (
    <>
      <ChartContainer
        title="Market Cap"
        loading={loading}
        error={error}
        onRetry={refetch}
        flush
        transparent
      >
        <TouchableOpacity
          style={{ height: COMPACT_CHART_HEIGHT }}
          onPress={openModal}
          activeOpacity={1}
        >
          {renderChart()}
        </TouchableOpacity>
      </ChartContainer>
      <FullChartModal
        visible={modalVisible}
        onClose={closeModal}
        symbol={DEFAULT_MARKET_SYMBOL}
      />
    </>
  );
};
