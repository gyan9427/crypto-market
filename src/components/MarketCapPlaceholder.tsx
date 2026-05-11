import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Stop, Rect, Line, Path, Circle } from 'react-native-svg';
import { Maximize2, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLiveMarketOverview } from '../hooks/useLiveMarketOverview';

// SVG coordinate space — never changes
const SVG_W = 400;
const SVG_H = 120;
// Inset so edge dots aren't clipped by the SVG boundary
const PAD = 6;
const INNER_W = SVG_W - PAD * 2;
const INNER_H = SVG_H - PAD * 2;

function formatTimeLabel(openTime: string | Date): string {
  const date = typeof openTime === 'string' ? new Date(openTime) : openTime;
  if (Number.isNaN(date.getTime())) return '--:--';
  const h = date.getHours();
  const m = date.getMinutes();
  const hr = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${hr}:${`${m}`.padStart(2, '0')}${suffix}`;
}

function fmtMarketShort(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

interface MarketCapPlaceholderProps {
  liveUpdatesEnabled?: boolean;
}

export const MarketCapPlaceholder: React.FC<MarketCapPlaceholderProps> = ({
  liveUpdatesEnabled = true,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const isDark = tokens.isDark;
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;

  const lineColor = '#3b82f6';
  const gradientId = useRef(`mcpGrad_${Math.random().toString(36).slice(2, 8)}`).current;

  const { height: screenHeight } = useWindowDimensions();
  // chart area in real pixels
  const chartAreaHeight = Math.round(screenHeight * 0.26);

  const { data, hasFetched } = useLiveMarketOverview({ enabled: liveUpdatesEnabled });
  const klines = data.klines;
  const isLoading = !hasFetched;
  const isPositive = data.absoluteChange24h >= 0;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartPixelWidth, setChartPixelWidth] = useState(SVG_W);

  // ── display strings ────────────────────────────────────────────────────────
  const displayCap = useMemo(() => {
    const v = data.totalMarketCap;
    if (v <= 0) return '$0';
    return fmtMarketShort(v);
  }, [data.totalMarketCap]);

  const displayAbsChange = useMemo(() => {
    if (data.totalMarketCap <= 0) return '+0';
    const abs = Math.abs(data.absoluteChange24h);
    const sign = data.absoluteChange24h >= 0 ? '+' : '-';
    return fmtMarketShort(abs).replace('$', `${sign}$`);
  }, [data.absoluteChange24h, data.totalMarketCap]);

  const displayPctChange = useMemo(() => {
    if (data.totalMarketCap <= 0) return '▲ 0.00%';
    const sign = data.relativeChange24h >= 0 ? '▲' : '▼';
    return `${sign} ${Math.abs(data.relativeChange24h).toFixed(2)}%`;
  }, [data.relativeChange24h, data.totalMarketCap]);

  // ── chart geometry ─────────────────────────────────────────────────────────
  const chartView = useMemo(() => {
    if (klines.length < 2) return null;

    const closes = klines.map((k) => k.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const stepX = INNER_W / Math.max(closes.length - 1, 1);

    // Points mapped into the inset coordinate space
    const points = closes.map((v, i) => ({
      x: PAD + i * stepX,
      y: PAD + INNER_H - ((v - min) / range) * INNER_H,
    }));

    const linePath = points.reduce(
      (acc, p, i) =>
        `${acc}${i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`}`,
      ''
    );
    const areaPath = [
      linePath,
      `L${points[points.length - 1].x.toFixed(1)},${SVG_H}`,
      `L${points[0].x.toFixed(1)},${SVG_H}`,
      'Z',
    ].join(' ');

    const first = closes[0];
    const last  = closes[closes.length - 1];
    const isChartUp = last >= first;

    // Extreme point: peak for rising chart, trough for falling chart
    const extremeIndex = isChartUp ? closes.indexOf(max) : closes.indexOf(min);
    const extremePoint = points[extremeIndex];
    const extremePrice = closes[extremeIndex];

    // Highlight column centred on the extreme point
    const span = Math.max(2, Math.floor(closes.length * 0.28));
    const colStart = Math.max(0, extremeIndex - Math.floor(span / 2));
    const colEnd   = Math.min(closes.length - 1, colStart + span);
    const colX = points[colStart].x;
    const colW = Math.max(0, points[colEnd].x - colX);

    // X-axis labels
    const idxs = [0, Math.floor((klines.length - 1) * 0.33), Math.floor((klines.length - 1) * 0.66), klines.length - 1];
    const labels = idxs.map((i) => formatTimeLabel(klines[i].openTime));

    // Y-axis: 2 labels pinned to chart edges — avoids crowding on tight ranges
    const yPriceLevels = [
      { price: max, svgY: PAD + 2 },
      { price: min, svgY: SVG_H - PAD - 2 },
    ];

    // Tooltip: show price at the extreme point (no change calc — avoids
    // conflicting with the 24 h header stats which use a different window)
    const peakPriceLabel = fmtMarketShort(extremePrice);
    const peakTimeLabel  = formatTimeLabel(klines[extremeIndex].openTime);

    return { linePath, areaPath, extremePoint, colX, colW, labels, points, yPriceLevels, isChartUp, peakPriceLabel, peakTimeLabel, min, max, range };
  }, [klines]);

  // ── derived pixel positions ────────────────────────────────────────────────
  const activePoint = chartView && hoverIndex !== null ? chartView.points[hoverIndex] : null;
  const activeKline  = hoverIndex !== null ? klines[hoverIndex] : null;

  // Converts SVG coords → real pixel coords
  const svgToPixel = (svgX: number, svgY: number) => ({
    x: (svgX / SVG_W) * chartPixelWidth,
    y: (svgY / SVG_H) * chartAreaHeight,
  });

  const hoverTooltipPos = useMemo(() => {
    if (!activePoint) return null;
    const px = svgToPixel(activePoint.x, activePoint.y);
    const w = 152;
    return {
      left: Math.min(Math.max(px.x - w / 2, 6), chartPixelWidth - w - 6),
      top: Math.max(px.y - 58, 6),
      width: w,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePoint, chartPixelWidth, chartAreaHeight]);

  const peakTooltipPos = useMemo(() => {
    if (!chartView) return null;
    const px = svgToPixel(chartView.extremePoint.x, chartView.extremePoint.y);
    const w = 150;
    return {
      left: Math.min(Math.max(px.x - w / 2, 4), chartPixelWidth - w - 4),
      top: Math.max(px.y - 52, 4),
      width: w,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartView, chartPixelWidth, chartAreaHeight]);

  const yLabelPositions = useMemo(() => {
    if (!chartView) return [];
    return chartView.yPriceLevels.map(({ price, svgY }) => ({
      price,
      top: Math.max(0, (svgY / SVG_H) * chartAreaHeight - 8),
    }));
  }, [chartView, chartAreaHeight]);

  const handlePointer = (xPx: number) => {
    if (!chartView) return;
    const maxIdx = chartView.points.length - 1;
    const ratio = Math.max(0, Math.min(1, xPx / Math.max(1, chartPixelWidth)));
    setHoverIndex(Math.max(0, Math.min(maxIdx, Math.round(ratio * maxIdx))));
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* Header: market cap + change */}
        <View style={styles.headerRow}>
          <View>
            {isLoading ? (
              <View style={styles.headerSkeleton}>
                <View style={[styles.skeletonBlock, styles.titleSkeleton]} />
                <View style={styles.statsRow}>
                  <View style={[styles.skeletonBlock, styles.statSkeleton]} />
                  <View style={[styles.skeletonBlock, styles.statSkeleton]} />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{displayCap}</Text>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsText, !isPositive && styles.negativeStatsText]}>{displayAbsChange}</Text>
                  <Text style={[styles.statsText, !isPositive && styles.negativeStatsText]}>{displayPctChange}</Text>
                </View>
              </>
            )}
          </View>
          <Text style={styles.periodLabel}>{t('marketCap.today')}</Text>
        </View>

        {/* Chart region */}
        <View
          style={[styles.chartWrapper, { height: chartAreaHeight }]}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setChartPixelWidth(w);
          }}
        >
          {isLoading ? (
            <View style={[styles.chartSkeleton, { height: chartAreaHeight }]} />
          ) : chartView ? (
            <>
              {/* SVG chart */}
              <Svg
                style={styles.svgChart}
                preserveAspectRatio="none"
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              >
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0"    stopColor={lineColor} stopOpacity={isDark ? 0.60 : 0.35} />
                    <Stop offset="0.55" stopColor={lineColor} stopOpacity={isDark ? 0.25 : 0.12} />
                    <Stop offset="1"    stopColor={lineColor} stopOpacity="0" />
                  </LinearGradient>
                </Defs>

                {/* Highlight column */}
                <Rect
                  x={chartView.colX} y={0}
                  width={chartView.colW} height={SVG_H}
                  fill={lineColor} fillOpacity={isDark ? 0.22 : 0.12}
                  rx={5}
                />

                {/* Area gradient */}
                <Path d={chartView.areaPath} fill={`url(#${gradientId})`} />

                {/* Line */}
                <Path
                  d={chartView.linePath}
                  fill="none"
                  stroke={lineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />

                {/* First & last dots: filled blue */}
                {[chartView.points[0], chartView.points[chartView.points.length - 1]].map((pt, i) => (
                  <Circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill={lineColor} stroke="white" strokeWidth="2" />
                ))}
                {/* Extreme dot: white fill + coloured border — clearly distinct */}
                <Circle
                  cx={chartView.extremePoint.x}
                  cy={chartView.extremePoint.y}
                  r={5}
                  fill="white"
                  stroke={lineColor}
                  strokeWidth="2.5"
                />

                {/* Hover crosshair */}
                {activePoint ? (
                  <>
                    <Line
                      x1={activePoint.x} x2={activePoint.x}
                      y1={0} y2={SVG_H}
                      stroke="rgba(255,255,255,0.30)"
                      strokeWidth="1" strokeDasharray="4"
                    />
                    <Circle
                      cx={activePoint.x} cy={activePoint.y}
                      r={5} fill={lineColor}
                      stroke="white" strokeWidth="2.5"
                    />
                  </>
                ) : null}
              </Svg>

              {/* Y-axis labels */}
              <View style={[styles.yAxisOverlay, { height: chartAreaHeight }]}>
                {yLabelPositions.map(({ price, top }, i) => (
                  <Text key={i} style={[styles.yAxisLabel, { top }]}>
                    {fmtMarketShort(price)}
                  </Text>
                ))}
              </View>

              {/* Static extreme tooltip (hidden while hovering) */}
              {!activeKline && peakTooltipPos ? (
                <View style={[styles.peakTooltip, { left: peakTooltipPos.left, top: peakTooltipPos.top }]}>
                  <Text style={[styles.peakTooltipPrice, { color: chartView.isChartUp ? '#4ade80' : '#f87171' }]}>
                    {chartView.peakPriceLabel}
                  </Text>
                  <Text style={styles.peakTooltipTime}>
                    {chartView.isChartUp ? '▲' : '▼'} {chartView.peakTimeLabel}
                  </Text>
                </View>
              ) : null}

              {/* Hover tooltip */}
              {activeKline && hoverTooltipPos ? (
                <View style={[styles.tooltipCard, {
                  left: hoverTooltipPos.left,
                  top: hoverTooltipPos.top,
                  width: hoverTooltipPos.width,
                }]}>
                  <Text style={styles.tooltipTime}>{formatTimeLabel(activeKline.openTime)}</Text>
                  <Text style={styles.tooltipValue}>
                    {`$${activeKline.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  </Text>
                </View>
              ) : null}

              {/* Touch interaction layer */}
              <View
                style={[styles.interactionLayer, { height: chartAreaHeight }]}
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

              {/* X-axis labels */}
              <View style={styles.xAxisLabels}>
                {chartView.labels.map((label, i) => (
                  <Text key={i} style={styles.xLabel}>{label}</Text>
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.chartSkeleton, { height: chartAreaHeight }]}>
              <Text style={styles.noDataText}>{t('marketCap.noActiveTrend')}</Text>
            </View>
          )}
        </View>

        {/* Utility row */}
        <View style={styles.utilitiesRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Maximize2 size={18} color="rgba(255,255,255,0.50)" />
          </TouchableOpacity>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <MoreHorizontal size={18} color="rgba(255,255,255,0.50)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryIconButton}>
              <TrendingUp size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;

  return StyleSheet.create({
    container: {
      marginBottom: 0,
    },
    card: {
      backgroundColor: tokens.isDark ? '#0f0520' : '#1a0a3c',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingTop: s.lg,
      paddingHorizontal: s.lg,
      paddingBottom: s.md,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: s.sm,
    },
    title: {
      fontSize: typo.fontSizes.xxxl,
      fontWeight: typo.fontWeights.light,
      fontFamily: typo.fontFamilies.sans,
      color: '#fafafa',
      letterSpacing: typo.letterSpacing.section,
      fontVariant: ['tabular-nums'],
    },
    headerSkeleton: {
      alignItems: 'flex-start',
    },
    skeletonBlock: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: br.sm,
    },
    titleSkeleton: { width: 140, height: 34 },
    statSkeleton:  { width: 64,  height: 14 },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      marginTop: s.xs,
    },
    statsText: {
      color: c.success[500],
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
      letterSpacing: typo.letterSpacing.caption,
    },
    negativeStatsText: {
      color: c.danger[500],
    },
    periodLabel: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: 'rgba(255,255,255,0.40)',
      textTransform: 'uppercase',
      letterSpacing: typo.letterSpacing.eyebrow,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    chartWrapper: {
      width: '100%',
      marginTop: s.md,
      position: 'relative',
    },
    svgChart: {
      width: '100%',
      height: '100%',
    },
    chartSkeleton: {
      width: '100%',
      borderRadius: br.md,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    yAxisOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 68,
    },
    yAxisLabel: {
      position: 'absolute',
      fontSize: typo.fontSizes.badge,
      color: 'rgba(255,255,255,0.38)',
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    peakTooltip: {
      position: 'absolute',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: br.sm,
      backgroundColor: 'rgba(10,10,10,0.72)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    peakTooltipPrice: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.bold,
      fontFamily: typo.fontFamilies.sansBold,
      fontVariant: ['tabular-nums'],
    },
    peakTooltipTime: {
      fontSize: typo.fontSizes.badge,
      color: 'rgba(255,255,255,0.50)',
      fontFamily: typo.fontFamilies.sans,
      marginTop: 1,
    },
    interactionLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    tooltipCard: {
      position: 'absolute',
      backgroundColor: 'rgba(10,10,10,0.90)',
      borderRadius: br.sm,
      borderWidth: 1,
      borderColor: 'rgba(168,85,247,0.25)',
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
    },
    tooltipTime: {
      fontSize: typo.fontSizes.badge,
      fontFamily: typo.fontFamilies.sansMedium,
      color: 'rgba(255,255,255,0.50)',
      marginBottom: 2,
    },
    tooltipValue: {
      fontSize: typo.fontSizes.xs,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: '#fafafa',
      fontWeight: typo.fontWeights.semibold,
      fontVariant: ['tabular-nums'],
    },
    xAxisLabels: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: s.sm,
    },
    xLabel: {
      fontSize: typo.fontSizes.badge,
      fontFamily: typo.fontFamilies.sans,
      color: 'rgba(255,255,255,0.35)',
      letterSpacing: typo.letterSpacing.caption,
    },
    noDataText: {
      color: 'rgba(255,255,255,0.35)',
      fontSize: typo.fontSizes.xs,
      fontFamily: typo.fontFamilies.sans,
      textAlign: 'center',
      marginTop: 50,
    },
    utilitiesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: s.lg,
    },
    iconButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: br.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
    },
    rightIcons: {
      flexDirection: 'row',
      gap: s.sm,
    },
    primaryIconButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary[500],
      borderRadius: br.md,
    },
  });
}
