import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Share,
  ScrollView,
  Platform,
} from 'react-native';
import { ChartWebView } from '../webview/ChartWebView';
import { PriceAreaChart } from './PriceAreaChart';
import { useKlinesInfinite } from '../hooks/useKlinesInfinite';
import { useChartTheme } from '../hooks/useChartTheme';
import { useMarketPrices } from '../../hooks/useMarketPrices';
import { klinesToLineData } from '../transform';
import { VALID_INTERVALS } from '../constants';
import { colors, spacing, borderRadius } from '../../theme/theme';
import type { KlineInterval } from '../types';

const isWeb = Platform.OS === 'web';

interface FullChartModalProps {
  visible: boolean;
  onClose: () => void;
  symbol: string;
}

const INDICATOR_OPTIONS: Record<string, { period?: number }> = {
  none: {},
  ema: { period: 20 },
  sma: { period: 20 },
  vwap: {},
  volumeMA: { period: 20 },
};

export const FullChartModal: React.FC<FullChartModalProps> = ({
  visible,
  onClose,
  symbol,
}) => {
  const { height } = useWindowDimensions();
  const theme = useChartTheme();
  const [interval, setInterval] = useState<KlineInterval>('1h');
  const [viewMode, setViewMode] = useState<'candlestick' | 'line'>('candlestick');
  const [indicator, setIndicator] = useState<string>('ema');
  const { prices } = useMarketPrices([symbol]);
  const chartContainerRef = useRef<View>(null);

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
  } = useKlinesInfinite(symbol, interval, { limit: 500 });

  const chartData = useMemo(
    () => klinesToLineData(data, 'close', interval),
    [data, interval]
  );

  const liveCandleUpdate = useMemo(() => {
    const p = prices.get(symbol);
    if (!p || candlestickData.length === 0) return undefined;
    const last = candlestickData[candlestickData.length - 1];
    return {
      close: p.price,
      high: Math.max(last.high, p.price),
      low: Math.min(last.low, p.price),
    };
  }, [prices, candlestickData, symbol]);

  const handleLoadHistorical = useCallback(
    (from: string, to: string) => {
      if (!hasMore || loadingMore) return;
      loadMore(new Date(from), new Date(to));
    },
    [loadMore, hasMore, loadingMore]
  );

  const handleShare = useCallback(async () => {
    try {
      if (!isWeb && chartContainerRef.current) {
        const { captureRef } = await import('react-native-view-shot');
        const uri = await captureRef(chartContainerRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        await Share.share({
          url: Platform.OS === 'ios' ? uri : `file://${uri}`,
          message: `${symbol} chart - ${interval}`,
          title: `${symbol} Price Chart`,
        });
      } else {
        await Share.share({
          message: `${symbol} chart - ${interval}`,
          title: `${symbol} Price Chart`,
        });
      }
    } catch {}
  }, [symbol, interval]);

  const indicators = indicator === 'none' ? {} : { [indicator]: INDICATOR_OPTIONS[indicator] };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme === 'dark' ? '#e5e5e5' : '#171717' }]}>
            {symbol} Chart
          </Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Text style={styles.primaryText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
          <View style={styles.toolbarRow}>
            <Text style={[styles.toolbarLabel, { color: theme === 'dark' ? '#a3a3a3' : '#525252' }]}>
              Timeframe:
            </Text>
            {VALID_INTERVALS.map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setInterval(i)}
                style={[
                  styles.pill,
                  interval === i && styles.pillActive,
                  { backgroundColor: interval === i ? colors.primary[500] : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: interval === i ? '#fff' : theme === 'dark' ? '#e5e5e5' : '#171717' },
                  ]}
                >
                  {i.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              onPress={() => setViewMode('candlestick')}
              style={[styles.pill, viewMode === 'candlestick' && styles.pillActive]}
            >
              <Text style={styles.pillText}>Candle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('line')}
              style={[styles.pill, viewMode === 'line' && styles.pillActive]}
            >
              <Text style={styles.pillText}>Line</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toolbarRow}>
            <Text style={[styles.toolbarLabel, { color: theme === 'dark' ? '#a3a3a3' : '#525252' }]}>
              Indicator:
            </Text>
            {Object.keys(INDICATOR_OPTIONS).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setIndicator(k)}
                style={[styles.pill, indicator === k && styles.pillActive]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: indicator === k ? '#fff' : theme === 'dark' ? '#e5e5e5' : '#171717' },
                  ]}
                >
                  {k === 'none' ? 'None' : k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View
          ref={chartContainerRef}
          style={[styles.chartWrapper, { height: height - 220 }]}
          collapsable={false}
        >
          {loading && candlestickData.length === 0 ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Loading chart...</Text>
            </View>
          ) : error ? (
            <View style={styles.placeholder}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                <Text style={styles.primaryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : isWeb ? (
            <PriceAreaChart
              data={chartData}
              height={height - 220}
              color={colors.primary[500]}
              showDataPoints={false}
            />
          ) : (
            <ChartWebView
              candlestickData={candlestickData}
              volumeData={volumeData}
              theme={theme}
              viewMode={viewMode}
              indicators={indicators}
              showVolume
              onLoadHistorical={handleLoadHistorical}
              liveCandleUpdate={liveCandleUpdate}
              style={styles.chart}
            />
          )}
        </View>
        <Text style={[styles.attribution, { color: theme === 'dark' ? '#525252' : '#a3a3a3' }]}>
          Charts by TradingView
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: 16,
    color: colors.primary[500],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    padding: spacing.sm,
  },
  primaryText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  toolbar: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  toolbarLabel: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.button,
  },
  pillActive: {
    backgroundColor: colors.primary[500],
  },
  pillText: {
    fontSize: 13,
    color: colors.neutral[700],
  },
  chartWrapper: {
    flex: 1,
    minHeight: 300,
  },
  chart: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: spacing.sm,
  },
  retryButton: {
    padding: spacing.sm,
  },
  attribution: {
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
});
