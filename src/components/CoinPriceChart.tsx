import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { fetchKlines, KlineInterval, KlineRecord } from '../services/api';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePollingEffect } from '../hooks/usePollingEffect';

type DisplayInterval = '1D' | '1W' | '1M';

const INTERVAL_MAP: Record<DisplayInterval, KlineInterval> = {
  '1D': '1m',
  '1W': '1h',
  '1M': '1d',
};

interface CoinPriceChartProps {
  symbol: string;
  height?: number;
}

type KlineCacheEntry = {
  rows: KlineRecord[];
  updatedAt: number;
};

const KLINE_CACHE_TTL_MS = 90_000;
const klineCache = new Map<string, KlineCacheEntry>();

function getCacheKey(symbol: string, interval: DisplayInterval): string {
  return `${symbol.toUpperCase()}::${interval}`;
}

function readKlineCache(symbol: string, interval: DisplayInterval): KlineRecord[] | null {
  const key = getCacheKey(symbol, interval);
  const entry = klineCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > KLINE_CACHE_TTL_MS) return null;
  return entry.rows;
}

export const CoinPriceChart: React.FC<CoinPriceChartProps> = ({
  symbol,
  height = 220,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildCoinPriceChartStyles(tokens), [tokens]);
  const c = tokens.colors;
  const s = tokens.spacing;

  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(200, width - s.md * 2);
  const chartHeight = Math.max(120, height - 60);
  const [interval, setInterval] = useState<DisplayInterval>('1W');
  const [klines, setKlines] = useState<KlineRecord[]>(() => readKlineCache(symbol, '1W') ?? []);
  const [loading, setLoading] = useState(() => !(readKlineCache(symbol, '1W')?.length));
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const cachedRows = readKlineCache(symbol, interval);
    if (cachedRows && cachedRows.length > 0) {
      setKlines(cachedRows);
      setLoading(false);
      setError(null);
      return;
    }

    setKlines([]);
    setHoverIndex(null);
    setLoading(true);
  }, [symbol, interval]);

  const refreshMs = interval === '1D' ? 15000 : interval === '1W' ? 30000 : 60000;
  usePollingEffect(
    async () => {
      if (!symbol) return;
      try {
        setError(null);
        const rows = await fetchKlines(symbol, INTERVAL_MAP[interval], 180);
        klineCache.set(getCacheKey(symbol, interval), { rows, updatedAt: Date.now() });
        setKlines(rows);
      } catch (err: any) {
        setError(err?.message || 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    },
    [symbol, interval, isFocused],
    { enabled: Boolean(symbol) && isFocused, intervalMs: refreshMs, immediate: true }
  );

  const chartView = useMemo(() => {
    if (klines.length < 2) return null;
    const closes = klines.map((k) => k.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const stepX = chartWidth / Math.max(closes.length - 1, 1);

    const points = closes.map((value, index) => ({
      x: index * stepX,
      y: chartHeight - ((value - min) / range) * chartHeight,
    }));

    const linePath = points.reduce(
      (acc, p, i) => `${acc}${i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`}`,
      ''
    );

    const first = closes[0];
    const last = closes[closes.length - 1];
    const stroke = last >= first ? c.success[500] : c.error[500];
    const marker = points[points.length - 1];

    const idxA = 0;
    const idxB = Math.floor((klines.length - 1) * 0.33);
    const idxC = Math.floor((klines.length - 1) * 0.66);
    const idxD = klines.length - 1;
    const labels = [
      formatTimeLabel(klines[idxA].openTime),
      formatTimeLabel(klines[idxB].openTime),
      formatTimeLabel(klines[idxC].openTime),
      formatTimeLabel(klines[idxD].openTime),
    ];

    return { linePath, stroke, marker, labels, last, points };
  }, [klines, chartHeight, chartWidth, c]);

  const activeIndex = hoverIndex;
  const activePoint = chartView && activeIndex !== null ? chartView.points[activeIndex] : null;
  const activeKline = activeIndex !== null ? klines[activeIndex] : null;

  const tooltipPosition = useMemo(() => {
    if (!activePoint) return null;
    const w = 140;
    const left = Math.min(Math.max(activePoint.x - w / 2, 6), chartWidth - w - 6);
    const top = Math.max(activePoint.y - 64, 6);
    return { left, top, width: w };
  }, [activePoint, chartWidth]);

  const handlePointer = (x: number) => {
    if (!chartView) return;
    const maxIdx = chartView.points.length - 1;
    const raw = Math.round((Math.max(0, Math.min(chartWidth, x)) / chartWidth) * maxIdx);
    const idx = Math.max(0, Math.min(maxIdx, raw));
    setHoverIndex(idx);
  };

  if (loading && !chartView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.intervalRow}>
          {(['1D', '1W', '1M'] as DisplayInterval[]).map((i) => (
            <View key={i} style={styles.intervalPill}>
              <Text style={styles.intervalText}>{i}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.chartSkeleton, { height: chartHeight }]} />
      </View>
    );
  }

  if (error && !chartView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.intervalRow}>
          {(['1D', '1W', '1M'] as DisplayInterval[]).map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.intervalPill, interval === i && styles.intervalPillActive]}
              onPress={() => setInterval(i)}
            >
              <Text style={[styles.intervalText, interval === i && styles.intervalTextActive]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!chartView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.intervalRow}>
          {(['1D', '1W', '1M'] as DisplayInterval[]).map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.intervalPill, interval === i && styles.intervalPillActive]}
              onPress={() => setInterval(i)}
            >
              <Text style={[styles.intervalText, interval === i && styles.intervalTextActive]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No chart data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.intervalRow}>
        {(['1D', '1W', '1M'] as DisplayInterval[]).map((i) => (
          <TouchableOpacity
            key={i}
            style={[styles.intervalPill, interval === i && styles.intervalPillActive]}
            onPress={() => setInterval(i)}
          >
            <Text style={[styles.intervalText, interval === i && styles.intervalTextActive]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.chartRegion, { height: chartHeight + 22 }]}>
        <Svg style={{ width: chartWidth, height: chartHeight }} preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Line
            stroke={c.neutral[300]}
            strokeDasharray="4"
            strokeWidth="1"
            x1="0"
            x2={chartWidth}
            y1={chartHeight / 2}
            y2={chartHeight / 2}
          />
          <Path
            d={chartView.linePath}
            fill="none"
            stroke={chartView.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
          <Circle cx={chartView.marker.x} cy={chartView.marker.y} fill={chartView.stroke} r="4" stroke={c.white} strokeWidth="2" />
          {activePoint ? (
            <>
              <Line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={chartHeight}
                stroke={c.neutral[400]}
                strokeWidth="1"
                strokeDasharray="3"
              />
              <Line
                x1={0}
                x2={chartWidth}
                y1={activePoint.y}
                y2={activePoint.y}
                stroke={c.neutral[400]}
                strokeWidth="1"
                strokeDasharray="3"
              />
              <Circle cx={activePoint.x} cy={activePoint.y} fill={chartView.stroke} r="4" stroke={c.white} strokeWidth="2" />
            </>
          ) : null}
        </Svg>
        <View
          style={[styles.chartInteractionLayer, { width: chartWidth, height: chartHeight }]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e: any) => handlePointer(e.nativeEvent.locationX)}
          onResponderMove={(e: any) => handlePointer(e.nativeEvent.locationX)}
          onResponderRelease={() => setHoverIndex(null)}
          onResponderTerminate={() => setHoverIndex(null)}
          {...({
            onMouseMove: (e: any) => handlePointer(e.nativeEvent.locationX),
            onMouseLeave: () => setHoverIndex(null),
          } as object)}
        />
        {activeKline && tooltipPosition ? (
          <View
            style={[
              styles.tooltipCard,
              { left: tooltipPosition.left, top: tooltipPosition.top, width: tooltipPosition.width },
            ]}
          >
            <Text style={styles.tooltipTime}>{formatTimeLabel(activeKline.openTime)}</Text>
            <Text style={styles.tooltipValue}>
              O {formatPrice(activeKline.open)} H {formatPrice(activeKline.high)}
            </Text>
            <Text style={styles.tooltipValue}>
              L {formatPrice(activeKline.low)} C {formatPrice(activeKline.close)}
            </Text>
          </View>
        ) : null}
        <View style={styles.xAxisLabels}>
          <Text style={styles.datetimeLabel}>{chartView.labels[0]}</Text>
          <Text style={styles.datetimeLabel}>{chartView.labels[1]}</Text>
          <Text style={styles.datetimeLabel}>{chartView.labels[2]}</Text>
          <Text style={styles.datetimeLabel}>{chartView.labels[3]}</Text>
        </View>
      </View>
      <Text style={styles.priceLabel}>${chartView.last.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
    </View>
  );
};

function formatTimeLabel(openTime: string | Date): string {
  const date = typeof openTime === 'string' ? new Date(openTime) : openTime;
  if (Number.isNaN(date.getTime())) return '--:--';
  const h = date.getHours();
  const m = `${date.getMinutes()}`.padStart(2, '0');
  const hour = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${hour}:${m}${suffix}`;
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildCoinPriceChartStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      marginBottom: s.md,
    },
    intervalRow: {
      flexDirection: 'row',
      gap: s.sm,
      marginBottom: s.sm,
    },
    intervalPill: {
      paddingHorizontal: s.md,
      paddingVertical: s.xs,
      borderRadius: br.sm,
      backgroundColor: c.neutral[200],
    },
    intervalPillActive: {
      backgroundColor: c.primary[500],
    },
    intervalText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[700],
    },
    intervalTextActive: {
      color: c.white,
    },
    loadingContainer: {
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartRegion: {
      width: '100%',
      position: 'relative',
    },
    chartSkeleton: {
      width: '100%',
      borderRadius: br.md,
      backgroundColor: c.neutral[200],
    },
    xAxisLabels: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    chartInteractionLayer: {
      position: 'absolute',
      left: 0,
      top: 0,
    },
    tooltipCard: {
      position: 'absolute',
      backgroundColor: c.neutral[900],
      borderRadius: br.sm,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      borderWidth: 1,
      borderColor: c.neutral[700],
    },
    tooltipTime: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[300],
      marginBottom: 2,
    },
    tooltipValue: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[50],
      fontWeight: typo.fontWeights.medium,
    },
    errorText: {
      fontSize: typo.fontSizes.sm,
      color: c.error[500],
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    priceLabel: {
      fontSize: typo.fontSizes.lg,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      marginTop: s.xs,
    },
    datetimeLabel: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
    },
  });
}
