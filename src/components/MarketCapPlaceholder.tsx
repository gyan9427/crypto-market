import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Stop, Rect, Line, Path, Circle } from 'react-native-svg';
import { Maximize2, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLiveMarketOverview } from '../hooks/useLiveMarketOverview';

const CHART_WIDTH = 400;
const CHART_HEIGHT = 120;

function formatTimeLabel(openTime: string | Date): string {
  const date = typeof openTime === 'string' ? new Date(openTime) : openTime;
  if (Number.isNaN(date.getTime())) return '--:--';
  const h = date.getHours();
  const m = date.getMinutes();
  const hr = h % 12 === 0 ? 12 : h % 12;
  const min = `${m}`.padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${hr}:${min}${suffix}`;
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
  const styles = useMemo(() => buildMarketCapPlaceholderStyles(tokens), [tokens]);
  const c = tokens.colors;
  const crosshair = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.20)';
  const lineColor = '#3b82f6';
  const gradientId = useRef(`mcpGrad_${Math.random().toString(36).slice(2, 8)}`).current;
  const { height: screenHeight } = useWindowDimensions();
  const chartAreaHeight = Math.round(screenHeight * 0.26);

  const { data, hasFetched } = useLiveMarketOverview({ enabled: liveUpdatesEnabled });
  const klines = data.klines;
  const isLoading = !hasFetched;
  const isPositive = data.absoluteChange24h >= 0;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartPixelWidth, setChartPixelWidth] = useState(CHART_WIDTH);

  const displayCap = useMemo(() => {
    if (data.totalMarketCap <= 0) return '$0';
    const value = data.totalMarketCap;
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
  }, [data.totalMarketCap]);

  const displayAbsChange = useMemo(() => {
    if (data.totalMarketCap <= 0) return '+0';
    const abs = Math.abs(data.absoluteChange24h);
    const sign = data.absoluteChange24h >= 0 ? '+' : '-';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    return `${sign}${abs.toFixed(2)}`;
  }, [data.absoluteChange24h, data.totalMarketCap]);

  const displayPctChange = useMemo(() => {
    if (data.totalMarketCap <= 0) return '▲ 0.00%';
    const sign = data.relativeChange24h >= 0 ? '▲' : '▼';
    return `${sign} ${Math.abs(data.relativeChange24h).toFixed(2)}%`;
  }, [data.relativeChange24h, data.totalMarketCap]);

  const chartView = useMemo(() => {
    if (klines.length < 2) {
      return null;
    }

    const closes = klines.map((k) => k.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const stepX = CHART_WIDTH / Math.max(klines.length - 1, 1);

    const points = closes.map((value, index) => {
      const x = index * stepX;
      const y = CHART_HEIGHT - ((value - min) / range) * CHART_HEIGHT;
      return { x, y };
    });

    const linePath = points.reduce(
      (acc, p, i) => `${acc}${i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`}`,
      ''
    );

    const areaPath = [
      linePath,
      `L${points[points.length - 1].x.toFixed(1)},${CHART_HEIGHT}`,
      `L${points[0].x.toFixed(1)},${CHART_HEIGHT}`,
      'Z',
    ].join(' ');

    const peakIndex = closes.indexOf(max);
    const peakPoint = points[peakIndex];

    const span = Math.max(2, Math.floor(closes.length * 0.28));
    const colStart = Math.max(0, peakIndex - Math.floor(span / 2));
    const colEnd = Math.min(closes.length - 1, colStart + span);
    const colX = points[colStart].x;
    const colW = Math.max(0, points[colEnd].x - colX);

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

    return { linePath, areaPath, peakPoint, colX, colW, labels, points };
  }, [klines]);

  const activePoint = chartView && hoverIndex !== null ? chartView.points[hoverIndex] : null;
  const activeKline = hoverIndex !== null ? klines[hoverIndex] : null;

  const tooltipPosition = useMemo(() => {
    if (!activePoint) return null;
    const tooltipWidth = 152;
    const pxX = (activePoint.x / CHART_WIDTH) * Math.max(1, chartPixelWidth);
    const pxY = (activePoint.y / CHART_HEIGHT) * CHART_HEIGHT;
    const left = Math.min(Math.max(pxX - tooltipWidth / 2, 6), Math.max(6, chartPixelWidth - tooltipWidth - 6));
    const top = Math.max(6, pxY - 58);
    return { left, top, width: tooltipWidth };
  }, [activePoint, chartPixelWidth]);

  const handlePointer = (xPx: number) => {
    if (!chartView) return;
    const maxIdx = chartView.points.length - 1;
    const ratio = Math.max(0, Math.min(1, xPx / Math.max(1, chartPixelWidth)));
    const idx = Math.max(0, Math.min(maxIdx, Math.round(ratio * maxIdx)));
    setHoverIndex(idx);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
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
            const width = e.nativeEvent.layout.width;
            if (width > 0) setChartPixelWidth(width);
          }}
        >
          {isLoading ? (
            <View style={[styles.chartSkeleton, { height: chartAreaHeight }]} />
          ) : chartView ? (
            <>
              <Svg style={styles.svgChart} preserveAspectRatio="none" viewBox="0 0 400 120">
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={lineColor} stopOpacity={isDark ? 0.45 : 0.25} />
                    <Stop offset="0.65" stopColor={lineColor} stopOpacity={isDark ? 0.15 : 0.08} />
                    <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
                  </LinearGradient>
                </Defs>

                {/* Highlight column around peak */}
                <Rect
                  x={chartView.colX}
                  y={0}
                  width={chartView.colW}
                  height={CHART_HEIGHT}
                  fill={lineColor}
                  fillOpacity={isDark ? 0.18 : 0.10}
                  rx={5}
                />

                {/* Gradient area fill */}
                <Path d={chartView.areaPath} fill={`url(#${gradientId})`} />

                {/* Main line */}
                <Path
                  d={chartView.linePath}
                  fill="none"
                  stroke={lineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />

                {/* Dots: first, peak, last */}
                {[chartView.points[0], chartView.peakPoint, chartView.points[chartView.points.length - 1]].map((pt, i) => (
                  <Circle key={i} cx={pt.x} cy={pt.y} r={4} fill={lineColor} stroke="white" strokeWidth="2" />
                ))}

                {/* Crosshair on hover */}
                {activePoint ? (
                  <>
                    <Line
                      x1={activePoint.x} x2={activePoint.x}
                      y1={0} y2={CHART_HEIGHT}
                      stroke={crosshair} strokeWidth="1" strokeDasharray="3"
                    />
                    <Circle cx={activePoint.x} cy={activePoint.y} r={5} fill={lineColor} stroke="white" strokeWidth="2" />
                  </>
                ) : null}
              </Svg>
              <View
                style={styles.interactionLayer}
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
                    {`$${activeKline.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  </Text>
                </View>
              ) : null}
              {/* X-Axis Labels */}
              <View style={styles.xAxisLabels}>
                <Text style={styles.xLabel}>{chartView.labels[0]}</Text>
                <Text style={styles.xLabel}>{chartView.labels[1]}</Text>
                <Text style={styles.xLabel}>{chartView.labels[2]}</Text>
                <Text style={styles.xLabel}>{chartView.labels[3]}</Text>
              </View>
            </>
          ) : (
            <View style={styles.chartSkeleton}>
              <Text style={styles.noDataText}>{t('marketCap.noActiveTrend')}</Text>
            </View>
          )}
        </View>

        {/* Utility Icons */}
        <View style={styles.utilitiesRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Maximize2 size={18} color={c.neutral[400]} />
          </TouchableOpacity>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <MoreHorizontal size={18} color={c.neutral[400]} />
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

function buildMarketCapPlaceholderStyles(tokens: ThemeTokens) {
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
    borderWidth: 1,
    borderColor: tokens.isDark ? 'rgba(168,85,247,0.20)' : 'rgba(168,85,247,0.35)',
    ...tokens.shadows.lg,
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
  titleSkeleton: {
    width: 140,
    height: 34,
  },
  statSkeleton: {
    width: 64,
    height: 14,
  },
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
  xAxisLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: s.sm,
  },
  interactionLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: CHART_HEIGHT,
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
