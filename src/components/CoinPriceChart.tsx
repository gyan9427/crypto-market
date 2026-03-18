import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { fetchKlines, KlineInterval, KlineRecord } from '../services/api';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
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

export const CoinPriceChart: React.FC<CoinPriceChartProps> = ({
  symbol,
  height = 220,
}) => {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(200, width - spacing.md * 2);
  const chartHeight = Math.max(120, height - 60);
  const [interval, setInterval] = useState<DisplayInterval>('1W');
  const [klines, setKlines] = useState<KlineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMs = interval === '1D' ? 15000 : interval === '1W' ? 30000 : 60000;
  usePollingEffect(
    async () => {
      if (!symbol) return;
      try {
        setError(null);
        const rows = await fetchKlines(symbol, INTERVAL_MAP[interval], 240);
        setKlines(rows);
      } catch (err: any) {
        setError(err?.message || 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    },
    [symbol, interval],
    { enabled: Boolean(symbol), intervalMs: refreshMs, immediate: true }
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
    const stroke = last >= first ? colors.success[500] : colors.error[500];
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

    return { linePath, stroke, marker, labels, last };
  }, [klines, chartHeight, chartWidth]);

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
            stroke={colors.neutral[300]}
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
          <Circle cx={chartView.marker.x} cy={chartView.marker.y} fill={chartView.stroke} r="4" stroke={colors.white} strokeWidth="2" />
        </Svg>
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

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  intervalPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[200],
  },
  intervalPillActive: {
    backgroundColor: colors.primary[500],
  },
  intervalText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  intervalTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartRegion: {
    width: '100%',
  },
  chartSkeleton: {
    width: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[200],
  },
  xAxisLabels: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.error[500],
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  priceLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginTop: spacing.xs,
  },
  datetimeLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
});
