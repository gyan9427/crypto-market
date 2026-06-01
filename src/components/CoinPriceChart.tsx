import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { fetchKlines } from '../charts/services/chartApi';
import type { KlineInterval, KlineRecord } from '@/src/types/kline';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePollingEffect } from '../hooks/usePollingEffect';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

type DisplayInterval = '1D' | '1W' | '1M';

const INTERVAL_MAP: Record<DisplayInterval, KlineInterval> = {
  '1D': '5m',  // 288 × 5m = 24h (was 180 × 1m = 3h)
  '1W': '1h',
  '1M': '1d',
};

const INTERVAL_LIMITS: Record<DisplayInterval, number> = {
  '1D': 288,
  '1W': 168,
  '1M': 30,
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
  const [klines, setKlines] = useState<KlineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hover state — shared value drives crosshair graphic on UI thread;
  // tooltipIndex (React state) updates only when the candle index changes.
  const hoverXSV = useSharedValue(-1);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const chartViewRef = useRef<ReturnType<typeof buildChartView> | null>(null);

  useEffect(() => {
    setKlines([]);
    setLoading(true);
    setError(null);
    hoverXSV.value = -1;
    runOnJS(setTooltipIndex)(null);
  }, [symbol, interval, hoverXSV]);

  const refreshMs = interval === '1D' ? 30_000 : interval === '1W' ? 60_000 : 120_000;
  usePollingEffect(
    async () => {
      if (!symbol) return;
      try {
        setError(null);
        const rows = await fetchKlines({
          symbol,
          interval: INTERVAL_MAP[interval],
          limit: INTERVAL_LIMITS[interval],
        });
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
    const view = buildChartView(klines, chartWidth, chartHeight, c, interval);
    chartViewRef.current = view;
    return view;
  }, [klines, chartHeight, chartWidth, c, interval]);

  // Derive candle index from hover X position — runs on UI thread
  const chartWidthSV = useSharedValue(chartWidth);
  const pointsLengthSV = useSharedValue(klines.length);
  chartWidthSV.value = chartWidth;
  pointsLengthSV.value = klines.length;

  useAnimatedReaction(
    () => {
      const x = hoverXSV.value;
      if (x < 0 || pointsLengthSV.value < 2) return -1;
      return Math.max(
        0,
        Math.min(
          pointsLengthSV.value - 1,
          Math.round((x / chartWidthSV.value) * (pointsLengthSV.value - 1))
        )
      );
    },
    (idx, prevIdx) => {
      if (idx !== prevIdx) {
        runOnJS(setTooltipIndex)(idx < 0 ? null : idx);
      }
    }
  );

  // Animated props for the crosshair vertical line and dot — pure UI thread
  const crosshairLineProps = useAnimatedProps(() => {
    const x = hoverXSV.value;
    return {
      x1: x < 0 ? -1 : x,
      x2: x < 0 ? -1 : x,
      opacity: x < 0 ? 0 : 1,
    };
  });

  // To animate the circle's cy we need to know the y for the current index.
  // We store points as two flat arrays in shared values.
  const hoverCyForIndex = useMemo(() => {
    if (!chartView) return -1;
    if (tooltipIndex === null || tooltipIndex < 0) return -1;
    return chartView.points[tooltipIndex]?.y ?? -1;
  }, [chartView, tooltipIndex]);

  const crosshairCircleProps = useAnimatedProps(() => {
    const x = hoverXSV.value;
    return {
      cx: x < 0 ? -1 : x,
      opacity: x < 0 ? 0 : 1,
    };
  });

  const activeKline = tooltipIndex !== null && tooltipIndex >= 0 ? klines[tooltipIndex] : null;
  const activePoint = tooltipIndex !== null && chartView ? chartView.points[tooltipIndex] : null;

  const hoverTooltipPos = useMemo(() => {
    if (!activePoint) return null;
    const w = 130;
    return {
      left: Math.min(Math.max(activePoint.x - w / 2, 4), chartWidth - w - 4),
      top: Math.max(activePoint.y - 56, 4),
      width: w,
    };
  }, [activePoint, chartWidth]);

  const handlePointerMove = (x: number) => {
    hoverXSV.value = Math.max(0, Math.min(chartWidth, x));
  };

  const handlePointerEnd = () => {
    hoverXSV.value = -1;
    setTooltipIndex(null);
  };

  const fillOpacity = isDark ? 0.42 : 0.24;

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

  const { stroke, linePath, areaPath, points, yPrices, xAxisItems } = chartView;

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

            {/* Area gradient fill */}
            <Path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <Path
              d={linePath}
              fill="none"
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Crosshair vertical line — animated, UI thread only */}
            <AnimatedLine
              animatedProps={crosshairLineProps}
              y1={0}
              y2={chartHeight}
              stroke={tokens.textMuted}
              strokeWidth="1"
              strokeDasharray="4"
            />

            {/* Crosshair dot — cy driven by React state (low-freq) */}
            <AnimatedCircle
              animatedProps={crosshairCircleProps}
              cy={hoverCyForIndex}
              r={5}
              fill={stroke}
              stroke={tokens.surface}
              strokeWidth="2"
            />
          </Svg>

          {/* Touch interaction layer */}
          <View
            style={[styles.interactionLayer, { width: chartWidth, height: chartHeight }]}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e: any) => handlePointerMove(e.nativeEvent.locationX)}
            onResponderMove={(e: any) => handlePointerMove(e.nativeEvent.locationX)}
            onResponderRelease={handlePointerEnd}
            onResponderTerminate={handlePointerEnd}
            {...({
              onMouseMove: (e: any) => handlePointerMove(e.nativeEvent.locationX),
              onMouseLeave: handlePointerEnd,
            } as object)}
          />

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

function buildChartView(
  klines: KlineRecord[],
  chartWidth: number,
  chartHeight: number,
  c: ThemeTokens['colors'],
  interval: DisplayInterval
) {
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

  const yPrices = [
    { price: max, y: chartHeight - ((max - min) / range) * chartHeight },
    { price: (max + min) / 2, y: chartHeight / 2 },
    { price: min, y: chartHeight },
  ];

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

  return { linePath, areaPath, stroke, isUp, points, yPrices, xAxisItems };
}

function formatXLabel(openTime: number, interval: DisplayInterval): string {
  const date = new Date(openTime);
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
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
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
      marginTop: 12,
    },
    intervalPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: br.pill,
      backgroundColor: 'transparent',
    },
    intervalPillActive: {
      backgroundColor: isDark ? c.neutral[200] : c.neutral[100],
    },
    intervalText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? c.neutral[600] : c.neutral[500],
    },
    intervalTextActive: {
      color: isDark ? c.neutral[900] : c.neutral[800],
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
    hoverTooltip: {
      position: 'absolute',
      backgroundColor: tokens.surfaceMuted,
      borderRadius: br.sm,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    hoverTooltipTime: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      marginBottom: 2,
    },
    hoverTooltipPrice: {
      fontSize: typo.fontSizes.sm,
      fontWeight: '700',
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
