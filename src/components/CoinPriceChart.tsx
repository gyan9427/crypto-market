import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle, Line } from 'react-native-svg';
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

const INTERVAL_LABELS: Record<DisplayInterval, string> = {
  '1D': '24h',
  '1W': 'Week',
  '1M': 'Month',
};

const Y_LABEL_WIDTH = 52;
const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const isDark = tokens.isDark;
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;
  const s = tokens.spacing;

  const gradientId = useRef(`cpcGrad_${Math.random().toString(36).slice(2, 8)}`).current;

  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(160, width - s.md * 2 - Y_LABEL_WIDTH);
  const chartHeight = Math.max(120, height - 60);

  const [interval, setInterval] = useState<DisplayInterval>('1W');
  const [klines, setKlines] = useState<KlineRecord[]>(() => readKlineCache(symbol, '1W') ?? []);
  const [loading, setLoading] = useState(() => !(readKlineCache(symbol, '1W')?.length));
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const cached = readKlineCache(symbol, interval);
    if (cached && cached.length > 0) {
      setKlines(cached);
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

    const points = closes.map((value, i) => ({
      x: i * stepX,
      y: chartHeight - ((value - min) / range) * chartHeight,
    }));

    const linePath = points.reduce(
      (acc, p, i) =>
        `${acc}${i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`}`,
      ''
    );

    const areaPath = [
      linePath,
      `L${points[points.length - 1].x.toFixed(1)},${chartHeight}`,
      `L${points[0].x.toFixed(1)},${chartHeight}`,
      'Z',
    ].join(' ');

    const first = closes[0];
    const last = closes[closes.length - 1];
    const isUp = last >= first;
    const stroke = isUp ? c.success[500] : c.error[500];

    const extremeIndex = isUp ? closes.indexOf(max) : closes.indexOf(min);
    const peakPoint = points[extremeIndex];

    const change = last - first;
    const changePct = (change / first) * 100;
    const changeLabel = `${isUp ? '+' : ''}$${Math.abs(change).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} (${Math.abs(changePct).toFixed(2)}%)`;

    // Highlight column centred on the extreme point
    const span = Math.max(2, Math.floor(closes.length * 0.28));
    const colStart = Math.max(0, extremeIndex - Math.floor(span / 2));
    const colEnd = Math.min(closes.length - 1, colStart + span);
    const colX = points[colStart].x;
    const colW = Math.max(0, points[colEnd].x - colX);

    // Y-axis: three price levels
    const yPrices = [
      { price: max, y: chartHeight - ((max - min) / range) * chartHeight },
      { price: (max + min) / 2, y: chartHeight / 2 },
      { price: min, y: chartHeight - ((min - min) / range) * chartHeight },
    ];

    // X-axis labels
    let xAxisItems: { label: string; x: number }[];
    if (interval === '1W') {
      const seen = new Set<number>();
      xAxisItems = [];
      klines.forEach((k, i) => {
        const day = new Date(k.openTime).getDay();
        if (!seen.has(day)) {
          seen.add(day);
          xAxisItems.push({ label: DAY_SHORT[day], x: points[i].x });
        }
      });
    } else {
      const idxs = [
        0,
        Math.floor((klines.length - 1) * 0.33),
        Math.floor((klines.length - 1) * 0.66),
        klines.length - 1,
      ];
      xAxisItems = idxs.map((idx) => ({
        label: formatXLabel(klines[idx].openTime, interval),
        x: points[idx].x,
      }));
    }

    return {
      linePath,
      areaPath,
      stroke,
      isUp,
      points,
      peakPoint,
      extremeIndex,
      changeLabel,
      change,
      last,
      yPrices,
      xAxisItems,
      colX,
      colW,
    };
  }, [klines, chartHeight, chartWidth, c, interval]);

  const activePoint =
    chartView && hoverIndex !== null ? chartView.points[hoverIndex] : null;
  const activeKline = hoverIndex !== null ? klines[hoverIndex] : null;

  const hoverTooltipPos = useMemo(() => {
    if (!activePoint) return null;
    const w = 130;
    return {
      left: Math.min(Math.max(activePoint.x - w / 2, 4), chartWidth - w - 4),
      top: Math.max(activePoint.y - 56, 4),
      width: w,
    };
  }, [activePoint, chartWidth]);

  const peakTooltipPos = useMemo(() => {
    if (!chartView) return null;
    const w = 172;
    const { peakPoint } = chartView;
    return {
      left: Math.min(Math.max(peakPoint.x - w / 2, 0), chartWidth - w),
      top: Math.max(peakPoint.y - 44, 4),
      width: w,
    };
  }, [chartView, chartWidth]);

  const handlePointer = (x: number) => {
    if (!chartView) return;
    const maxIdx = chartView.points.length - 1;
    const idx = Math.max(
      0,
      Math.min(maxIdx, Math.round((Math.max(0, Math.min(chartWidth, x)) / chartWidth) * maxIdx))
    );
    setHoverIndex(idx);
  };

  const fillOpacity = isDark ? 0.42 : 0.24;
  const colOpacity = isDark ? 0.20 : 0.13;

  const renderPills = (interactive: boolean) => (
    <View style={styles.intervalRow}>
      {(['1D', '1W', '1M'] as DisplayInterval[]).map((i) =>
        interactive ? (
          <TouchableOpacity
            key={i}
            style={[styles.intervalPill, interval === i && styles.intervalPillActive]}
            onPress={() => setInterval(i)}
          >
            <Text style={[styles.intervalText, interval === i && styles.intervalTextActive]}>
              {INTERVAL_LABELS[i]}
            </Text>
          </TouchableOpacity>
        ) : (
          <View key={i} style={styles.intervalPill}>
            <Text style={styles.intervalText}>{INTERVAL_LABELS[i]}</Text>
          </View>
        )
      )}
    </View>
  );

  if (loading && !chartView) {
    return (
      <View style={styles.container}>
        {renderPills(false)}
        <View style={[styles.chartSkeleton, { height: chartHeight }]} />
      </View>
    );
  }

  if (error && !chartView) {
    return (
      <View style={styles.container}>
        {renderPills(true)}
        <View style={styles.placeholderBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!chartView) {
    return (
      <View style={styles.container}>
        {renderPills(true)}
        <View style={styles.placeholderBox}>
          <Text style={styles.emptyText}>{t('coin.noChartData')}</Text>
        </View>
      </View>
    );
  }

  const { stroke, linePath, areaPath, points, peakPoint, changeLabel, change, yPrices, xAxisItems, colX, colW } = chartView;

  return (
    <View style={styles.container}>
      {renderPills(true)}

      <View style={styles.chartWrapper}>
        {/* Y-axis labels */}
        <View style={[styles.yAxis, { height: chartHeight }]}>
          {yPrices.map(({ price, y }, idx) => (
            <Text
              key={idx}
              style={[styles.yLabel, { top: Math.max(0, Math.min(y - 8, chartHeight - 16)) }]}
              numberOfLines={1}
            >
              ${formatPriceShort(price)}
            </Text>
          ))}
        </View>

        {/* SVG + overlays */}
        <View style={{ width: chartWidth }}>
          <Svg
            width={chartWidth}
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity={fillOpacity} />
                <Stop offset="0.7" stopColor={stroke} stopOpacity={fillOpacity * 0.3} />
                <Stop offset="1" stopColor={stroke} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Highlight column */}
            <Rect
              x={colX}
              y={0}
              width={colW}
              height={chartHeight}
              fill={stroke}
              fillOpacity={colOpacity}
              rx={6}
            />

            {/* Area gradient fill */}
            <Path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <Path
              d={linePath}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots: first, peak, last */}
            {[points[0], peakPoint, points[points.length - 1]].map((pt, i) => (
              <Circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={stroke}
                stroke={isDark ? '#ffffff' : '#ffffff'}
                strokeWidth="2"
              />
            ))}

            {/* Crosshair on hover */}
            {activePoint ? (
              <>
                <Line
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1={0}
                  y2={chartHeight}
                  stroke={tokens.textMuted}
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <Circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={5}
                  fill={stroke}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </>
            ) : null}
          </Svg>

          {/* Touch interaction layer */}
          <View
            style={[styles.interactionLayer, { width: chartWidth, height: chartHeight }]}
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

          {/* Static peak tooltip (hidden while hovering) */}
          {!activeKline && peakTooltipPos ? (
            <View style={[styles.peakTooltip, { left: peakTooltipPos.left, top: peakTooltipPos.top }]}>
              <Text style={[styles.peakTooltipText, { color: stroke }]}>
                {change >= 0 ? '▲ ' : '▼ '}
                {changeLabel}
              </Text>
            </View>
          ) : null}

          {/* Hover tooltip */}
          {activeKline && hoverTooltipPos ? (
            <View
              style={[
                styles.hoverTooltip,
                { left: hoverTooltipPos.left, top: hoverTooltipPos.top, width: hoverTooltipPos.width },
              ]}
            >
              <Text style={styles.hoverTooltipTime}>{formatXLabel(activeKline.openTime, interval)}</Text>
              <Text style={[styles.hoverTooltipPrice, { color: stroke }]}>
                ${formatPrice(activeKline.close)}
              </Text>
            </View>
          ) : null}

          {/* X-axis */}
          <View style={[styles.xAxis, { width: chartWidth }]}>
            {xAxisItems.map((item, idx) => (
              <Text
                key={idx}
                style={[styles.xLabel, { left: Math.max(0, item.x - 10) }]}
              >
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

function formatXLabel(openTime: string | Date, interval: DisplayInterval): string {
  const date = typeof openTime === 'string' ? new Date(openTime) : openTime;
  if (Number.isNaN(date.getTime())) return '--';
  if (interval === '1W') {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }
  if (interval === '1M') {
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
  }
  const h = date.getHours();
  const m = `${date.getMinutes()}`.padStart(2, '0');
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m}${h >= 12 ? 'PM' : 'AM'}`;
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatPriceShort(value: number): string {
  if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  const isDark = tokens.isDark;

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
      borderRadius: br.pill,
      backgroundColor: isDark ? c.neutral[200] : c.neutral[100],
    },
    intervalPillActive: {
      backgroundColor: c.primary[500],
    },
    intervalText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: isDark ? c.neutral[700] : c.neutral[600],
    },
    intervalTextActive: {
      color: '#ffffff',
    },
    chartSkeleton: {
      width: '100%',
      borderRadius: br.md,
      backgroundColor: isDark ? c.neutral[200] : c.neutral[100],
    },
    placeholderBox: {
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: typo.fontSizes.sm,
      color: c.error[500],
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    chartWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    yAxis: {
      width: Y_LABEL_WIDTH,
      position: 'relative',
    },
    yLabel: {
      position: 'absolute',
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      width: Y_LABEL_WIDTH - 4,
      textAlign: 'right',
    },
    interactionLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    peakTooltip: {
      position: 'absolute',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: br.sm,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    peakTooltipText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.bold,
    },
    hoverTooltip: {
      position: 'absolute',
      backgroundColor: isDark ? c.neutral[200] : '#ffffff',
      borderRadius: br.sm,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      borderWidth: 1,
      borderColor: isDark ? c.neutral[300] : c.neutral[200],
    },
    hoverTooltipTime: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      marginBottom: 2,
    },
    hoverTooltipPrice: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.bold,
    },
    xAxis: {
      position: 'relative',
      height: 20,
      marginTop: 6,
    },
    xLabel: {
      position: 'absolute',
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
    },
  });
}
