import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Path, Stop, Line, Circle } from 'react-native-svg';
import type { KlineInterval } from '../types';
import type { KlineRecord } from '@/src/types/kline';
import { fetchKlines } from '../services/chartApi';
import type { ThemeTokens } from '../../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePollingEffect } from '../../hooks/usePollingEffect';

const SkiaChart = lazy(() => import('./SkiaChart'));

const Y_AXIS_W = 52;
const X_AXIS_H = 22;
const CHART_PAD = 6;
const Y_TICK_COUNT = 5;
const WEB_CHART_HEIGHT = 200;

const INTERVAL_LIMIT: Partial<Record<KlineInterval, number>> = {
  '1m': 60,
  '5m': 288,
  '15m': 96,
  '1h': 168,
  '4h': 180,
  '1d': 90,
  '1w': 52,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ProfessionalChartProps {
  symbol: string;
  interval: KlineInterval;
  style?: object;
}

interface CoinChartView {
  linePath: string;
  areaPath: string;
  strokeColor: string;
  yPriceLevels: { price: number; y: number }[];
  xLabels: string[];
  points: { x: number; y: number }[];
  lastPoint: { x: number; y: number };
}

function formatCoinChartXLabel(openTime: number, interval: KlineInterval): string {
  const date = new Date(openTime);
  if (Number.isNaN(date.getTime())) return '--';
  const h = date.getHours();
  const hr = h % 12 === 0 ? 12 : h % 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const m = `${date.getMinutes()}`.padStart(2, '0');

  if (interval === '1m' || interval === '5m' || interval === '15m') {
    return `${hr}:${m}${ampm}`;
  }
  if (interval === '1h' || interval === '4h') {
    return `${DAYS[date.getDay()]} ${hr}${ampm}`;
  }
  if (interval === '1d') {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  }
  return MONTHS[date.getMonth()];
}

function fmtCoinAxisPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `$${(value / 1_000).toFixed(1)}k`;
  if (value >= 1_000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function buildCoinChartView(
  klines: KlineRecord[],
  width: number,
  height: number,
  interval: KlineInterval,
  tokens: ThemeTokens
): CoinChartView | null {
  if (klines.length < 2 || width <= 0) return null;

  const closes = klines.map((k) => k.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const innerW = Math.max(1, width - CHART_PAD * 2);
  const innerH = Math.max(1, height - CHART_PAD * 2);
  const stepX = innerW / Math.max(closes.length - 1, 1);

  const mapY = (v: number) => CHART_PAD + innerH - ((v - min) / range) * innerH;

  const points = closes.map((v, i) => ({
    x: CHART_PAD + i * stepX,
    y: mapY(v),
  }));

  const linePath = points.reduce(
    (acc, p, i) =>
      `${acc}${i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`}`,
    ''
  );

  const areaPath = [
    linePath,
    `L${points[points.length - 1].x.toFixed(1)},${height - CHART_PAD}`,
    `L${points[0].x.toFixed(1)},${height - CHART_PAD}`,
    'Z',
  ].join(' ');

  const strokeColor =
    closes[closes.length - 1] >= closes[0] ? tokens.colors.success[600] : tokens.colors.danger[600];

  const xLabels = [0, Math.floor((klines.length - 1) * 0.33), Math.floor((klines.length - 1) * 0.66), klines.length - 1].map(
    (i) => formatCoinChartXLabel(klines[i].openTime, interval)
  );

  const yPriceLevels = Array.from({ length: Y_TICK_COUNT }, (_, i) => {
    const t = i / (Y_TICK_COUNT - 1);
    return { price: max - t * range, y: CHART_PAD + t * innerH };
  });

  return {
    linePath,
    areaPath,
    strokeColor,
    yPriceLevels,
    xLabels,
    points,
    lastPoint: points[points.length - 1],
  };
}

function UniversalLineChart({ symbol, interval, style }: ProfessionalChartProps) {
  const { tokens } = useAppTheme();
  const isDark = tokens.isDark;
  const styles = useMemo(() => buildProfessionalChartStyles(tokens), [tokens]);
  const isFocused = useIsFocused();

  const [klines, setKlines] = useState<KlineRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const limit = INTERVAL_LIMIT[interval] ?? 72;
  const refreshMs = interval === '1m' ? 30_000 : interval === '5m' || interval === '15m' ? 60_000 : 120_000;

  const loadKlines = useCallback(async () => {
    if (!symbol) return;
    try {
      const rows = await fetchKlines({ symbol, interval, limit });
      setKlines(rows);
    } catch {
      setKlines([]);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [symbol, interval, limit]);

  useEffect(() => {
    setKlines([]);
    setIsLoading(true);
    setHasFetched(false);
    setHoverIndex(null);
  }, [symbol, interval]);

  usePollingEffect(
    loadKlines,
    [loadKlines, isFocused],
    { enabled: Boolean(symbol) && isFocused, intervalMs: refreshMs, immediate: true }
  );

  const chartView = useMemo(
    () => buildCoinChartView(klines, chartWidth, WEB_CHART_HEIGHT, interval, tokens),
    [klines, chartWidth, interval, tokens]
  );

  const gridStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const crosshairStroke = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)';
  const markerStroke = isDark ? '#ffffff' : tokens.surface;

  const yLabelPositions = useMemo(() => {
    if (!chartView) return [];
    return chartView.yPriceLevels.map(({ price, y }) => ({
      price,
      top: Math.max(0, y - 8),
    }));
  }, [chartView]);

  const activePoint = chartView && hoverIndex !== null ? chartView.points[hoverIndex] : null;
  const activeKline = hoverIndex !== null ? klines[hoverIndex] : null;

  const handlePointer = (xPx: number) => {
    if (!chartView) return;
    const ratio = Math.max(0, Math.min(1, xPx / Math.max(1, chartWidth)));
    const maxIdx = chartView.points.length - 1;
    setHoverIndex(Math.max(0, Math.min(maxIdx, Math.round(ratio * maxIdx))));
  };

  return (
    <View style={[styles.webFallback, style]}>
      <View style={styles.chartRow}>
        <View style={[styles.yAxisColumn, { height: WEB_CHART_HEIGHT }]}>
          {yLabelPositions.map(({ price, top }, i) => (
            <Text key={i} style={[styles.yAxisLabel, { top }]} numberOfLines={1}>
              {fmtCoinAxisPrice(price)}
            </Text>
          ))}
        </View>

        <View
          style={styles.chartMain}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setChartWidth(w);
          }}
        >
          {chartWidth > 0 && chartView ? (
            <>
              <Svg width={chartWidth} height={WEB_CHART_HEIGHT} viewBox={`0 0 ${chartWidth} ${WEB_CHART_HEIGHT}`}>
                <Defs>
                  <LinearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={chartView.strokeColor} stopOpacity={isDark ? 0.45 : 0.25} />
                    <Stop offset="0.6" stopColor={chartView.strokeColor} stopOpacity={isDark ? 0.12 : 0.05} />
                    <Stop offset="1" stopColor={chartView.strokeColor} stopOpacity="0" />
                  </LinearGradient>
                </Defs>

                {chartView.yPriceLevels.map(({ y }, i) => (
                  <Line
                    key={i}
                    x1={0}
                    x2={chartWidth}
                    y1={y}
                    y2={y}
                    stroke={gridStroke}
                    strokeWidth="0.5"
                    strokeDasharray="3 4"
                  />
                ))}

                <Path d={chartView.areaPath} fill="url(#lineFill)" />
                <Path
                  d={chartView.linePath}
                  fill="none"
                  stroke={chartView.strokeColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <Circle
                  cx={chartView.lastPoint.x}
                  cy={chartView.lastPoint.y}
                  r={3.5}
                  fill={chartView.strokeColor}
                  stroke={markerStroke}
                  strokeWidth={1.5}
                />

                {activePoint ? (
                  <>
                    <Line
                      x1={activePoint.x}
                      x2={activePoint.x}
                      y1={0}
                      y2={WEB_CHART_HEIGHT}
                      stroke={crosshairStroke}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <Circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r={4}
                      fill={chartView.strokeColor}
                      stroke={markerStroke}
                      strokeWidth={2}
                    />
                  </>
                ) : null}
              </Svg>

              {activeKline && activePoint ? (
                <View
                  style={[
                    styles.hoverLabel,
                    {
                      left: Math.min(Math.max(activePoint.x - 45, 4), chartWidth - 94),
                      top: Math.max(activePoint.y - 36, 4),
                    },
                  ]}
                >
                  <Text style={styles.hoverLabelTime}>
                    {formatCoinChartXLabel(activeKline.openTime, interval)}
                  </Text>
                  <Text style={[styles.hoverLabelPrice, { color: chartView.strokeColor }]}>
                    {fmtCoinAxisPrice(activeKline.close)}
                  </Text>
                </View>
              ) : null}

              <View
                style={[styles.interactionLayer, { height: WEB_CHART_HEIGHT }]}
                onStartShouldSetResponder={() => true}
                onResponderGrant={(e: { nativeEvent: { locationX: number } }) =>
                  handlePointer(e.nativeEvent.locationX)
                }
                onResponderMove={(e: { nativeEvent: { locationX: number } }) =>
                  handlePointer(e.nativeEvent.locationX)
                }
                onResponderRelease={() => setHoverIndex(null)}
                onResponderTerminate={() => setHoverIndex(null)}
                {...({
                  onMouseMove: (e: { nativeEvent: { locationX: number } }) =>
                    handlePointer(e.nativeEvent.locationX),
                  onMouseLeave: () => setHoverIndex(null),
                } as object)}
              />

              <View style={styles.xAxisLabels}>
                {chartView.xLabels.map((label, i) => (
                  <Text key={i} style={styles.xLabel}>
                    {label}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.chartSkeleton, { height: WEB_CHART_HEIGHT + X_AXIS_H }]}>
              {isLoading ? <Text style={styles.stateText}>Loading chart...</Text> : null}
              {!isLoading && hasFetched ? <Text style={styles.stateText}>No market data</Text> : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export function ProfessionalChart(props: ProfessionalChartProps) {
  if (Platform.OS === 'web') {
    return <UniversalLineChart {...props} />;
  }
  return (
    <Suspense fallback={<ProfessionalChartFallback style={props.style} />}>
      <SkiaChart {...props} />
    </Suspense>
  );
}

function ProfessionalChartFallback({ style }: { style?: object }) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildProfessionalChartStyles(tokens), [tokens]);
  return <View style={[styles.webFallback, style]} />;
}

function buildProfessionalChartStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  return StyleSheet.create({
    webFallback: {
      flex: 1,
      minHeight: WEB_CHART_HEIGHT + X_AXIS_H,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      backgroundColor: tokens.bgElevated,
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    yAxisColumn: {
      width: Y_AXIS_W,
      position: 'relative',
      flexShrink: 0,
    },
    yAxisLabel: {
      position: 'absolute',
      right: 6,
      width: Y_AXIS_W - 8,
      textAlign: 'right',
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      fontVariant: ['tabular-nums'],
    },
    chartMain: {
      flex: 1,
      position: 'relative',
    },
    chartSkeleton: {
      flex: 1,
      marginHorizontal: 8,
      borderRadius: 12,
      backgroundColor: tokens.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stateText: {
      fontSize: 12,
      color: tokens.textMuted,
    },
    interactionLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    hoverLabel: {
      position: 'absolute',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: tokens.borderRadius.sm,
      backgroundColor: tokens.isDark ? 'rgba(22,22,28,0.92)' : 'rgba(250,250,252,0.96)',
      borderWidth: 0.5,
      borderColor: tokens.isDark ? 'rgba(99,131,255,0.28)' : 'rgba(99,131,255,0.35)',
    },
    hoverLabelTime: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
    },
    hoverLabelPrice: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontVariant: ['tabular-nums'],
      marginTop: 1,
    },
    xAxisLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: tokens.spacing.sm,
      paddingHorizontal: 2,
      height: X_AXIS_H,
    },
    xLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      letterSpacing: typo.letterSpacing.caption,
    },
  });
}
