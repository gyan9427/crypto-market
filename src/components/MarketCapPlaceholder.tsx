import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Line,
  Path,
  Circle,
} from 'react-native-svg';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLiveMarketOverview } from '../hooks/useLiveMarketOverview';

// ─── SVG coordinate space ────────────────────────────────────────────────────
const SVG_W   = 400;
const SVG_H   = 120;
const PAD     = 6;
const INNER_W = SVG_W - PAD * 2;
const INNER_H = SVG_H - PAD * 2;

// ─── Colours ─────────────────────────────────────────────────────────────────
const LINE_COLOR = '#6383ff';
const GREEN      = '#27c485';
const RED        = '#f05252';
const BG_CARD    = '#0a0a0f';
const BG_SURFACE = '#11111c';
const BORDER_DIM = 'rgba(255,255,255,0.07)';
const TEXT_DIM   = 'rgba(255,255,255,0.38)';
const TEXT_MID   = 'rgba(255,255,255,0.55)';

// ─── Range tabs ───────────────────────────────────────────────────────────────
const RANGE_TABS = ['1H', '1D', '1W', '1M', '3M', '1Y'] as const;
type RangeTab = (typeof RANGE_TABS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimeLabel(openTime: string | number | Date): string {
  const date = openTime instanceof Date ? openTime : new Date(openTime);
  if (Number.isNaN(date.getTime())) return '--:--';
  const h  = date.getHours();
  const m  = date.getMinutes();
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${`${m}`.padStart(2, '0')}${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtMarketShort(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

// ─── Chart view type ─────────────────────────────────────────────────────────
interface ChartView {
  linePath: string;
  areaPath: string;
  points: { x: number; y: number }[];
  xLabels: string[];
  yPriceLevels: { price: number; svgY: number }[];
  lastPoint: { x: number; y: number };
}

// ─── Memoized SVG — only re-renders when paths or hover changes ───────────────
interface ChartSvgProps {
  view: ChartView;
  gradientId: string;
  isDark: boolean;
  activePoint: { x: number; y: number } | null;
}

const ChartSvg = memo<ChartSvgProps>(({ view, gradientId, isDark, activePoint }) => (
  <Svg
    style={svgStyle}
    preserveAspectRatio="none"
    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
  >
    <Defs>
      <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0"   stopColor={LINE_COLOR} stopOpacity={isDark ? 0.45 : 0.25} />
        <Stop offset="0.6" stopColor={LINE_COLOR} stopOpacity={isDark ? 0.12 : 0.05} />
        <Stop offset="1"   stopColor={LINE_COLOR} stopOpacity="0" />
      </LinearGradient>
    </Defs>

    {/* Area gradient fill */}
    <Path d={view.areaPath} fill={`url(#${gradientId})`} />

    {/* Price curve */}
    <Path
      d={view.linePath}
      fill="none"
      stroke={LINE_COLOR}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />

    {/* Live dot at end of curve */}
    <Circle
      cx={view.lastPoint.x}
      cy={view.lastPoint.y}
      r={3.5}
      fill={LINE_COLOR}
      stroke="white"
      strokeWidth="1.5"
    />

    {/* Hover crosshair */}
    {activePoint ? (
      <>
        <Line
          x1={activePoint.x} x2={activePoint.x}
          y1={0} y2={SVG_H}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <Circle
          cx={activePoint.x}
          cy={activePoint.y}
          r={4}
          fill={LINE_COLOR}
          stroke="white"
          strokeWidth="2"
        />
      </>
    ) : null}
  </Svg>
));

const svgStyle = { width: '100%' as const, height: '100%' as const };

// ─── Props ────────────────────────────────────────────────────────────────────
interface MarketCapPlaceholderProps {
  liveUpdatesEnabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const MarketCapPlaceholder: React.FC<MarketCapPlaceholderProps> = ({
  liveUpdatesEnabled = true,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const isDark = tokens.isDark;
  const styles = useMemo(() => buildStyles(tokens), [tokens]);

  const gradientId = useRef(`mcpGrad_${Math.random().toString(36).slice(2, 8)}`).current;

  const { height: screenHeight } = useWindowDimensions();
  const chartAreaHeight = Math.round(screenHeight * 0.26);

  const { data, hasFetched } = useLiveMarketOverview({ enabled: liveUpdatesEnabled });
  const klines     = data.klines;
  const isLoading  = !hasFetched;
  const isPositive = data.absoluteChange24h >= 0;

  const [activeRange, setActiveRange]         = useState<RangeTab>('1D');
  const [hoverIndex, setHoverIndex]           = useState<number | null>(null);
  const [chartPixelWidth, setChartPixelWidth] = useState(SVG_W);

  // ── Display strings ─────────────────────────────────────────────────────────
  const displayCap = useMemo(() => {
    const v = data.totalMarketCap;
    return v <= 0 ? '$0' : fmtMarketShort(v);
  }, [data.totalMarketCap]);

  const displayAbsChange = useMemo(() => {
    if (data.totalMarketCap <= 0) return '+$0';
    const abs  = Math.abs(data.absoluteChange24h);
    const sign = data.absoluteChange24h >= 0 ? '+' : '-';
    return fmtMarketShort(abs).replace('$', `${sign}$`);
  }, [data.absoluteChange24h, data.totalMarketCap]);

  const displayPctChange = useMemo(() => {
    if (data.totalMarketCap <= 0) return '▲ 0.00%';
    const sign = data.relativeChange24h >= 0 ? '▲' : '▼';
    return `${sign} ${Math.abs(data.relativeChange24h).toFixed(2)}%`;
  }, [data.relativeChange24h, data.totalMarketCap]);

  // ── Chart geometry ──────────────────────────────────────────────────────────
  const freshChartView = useMemo<ChartView | null>(() => {
    if (klines.length < 2) return null;

    const closes = klines.map((k) => k.close);
    const min    = Math.min(...closes);
    const max    = Math.max(...closes);
    const range  = max - min || 1;
    const stepX  = INNER_W / Math.max(closes.length - 1, 1);

    const mapY = (v: number) => PAD + INNER_H - ((v - min) / range) * INNER_H;

    const points = closes.map((v, i) => ({ x: PAD + i * stepX, y: mapY(v) }));

    const linePath = points.reduce(
      (acc, p, i) =>
        `${acc}${i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`}`,
      '',
    );
    const areaPath = [
      linePath,
      `L${points[points.length - 1].x.toFixed(1)},${SVG_H}`,
      `L${points[0].x.toFixed(1)},${SVG_H}`,
      'Z',
    ].join(' ');

    const xLabels = [
      0,
      Math.floor((klines.length - 1) * 0.33),
      Math.floor((klines.length - 1) * 0.66),
      klines.length - 1,
    ].map((i) => formatTimeLabel(klines[i].openTime));

    const yPriceLevels = [
      { price: max, svgY: PAD + 2 },
      { price: min, svgY: SVG_H - PAD - 2 },
    ];

    return { linePath, areaPath, points, xLabels, yPriceLevels, lastPoint: points[points.length - 1] };
  }, [klines]);

  // Keep the last valid chartView so the chart never flashes blank during updates.
  const lastChartViewRef = useRef<ChartView | null>(null);
  if (freshChartView) lastChartViewRef.current = freshChartView;
  const chartView = lastChartViewRef.current;

  // ── Hover state ─────────────────────────────────────────────────────────────
  const activePoint = chartView && hoverIndex !== null ? chartView.points[hoverIndex] : null;
  const activeKline = hoverIndex !== null ? klines[hoverIndex] : null;

  const hoverLabelPos = useMemo(() => {
    if (!activePoint) return null;
    const px = (activePoint.x / SVG_W) * chartPixelWidth;
    const py = (activePoint.y / SVG_H) * chartAreaHeight;
    const w  = 90;
    return {
      left: Math.min(Math.max(px - w / 2, 4), chartPixelWidth - w - 4),
      top:  Math.max(py - 32, 4),
      width: w,
    };
  }, [activePoint, chartPixelWidth, chartAreaHeight]);

  const yLabelPositions = useMemo(() => {
    if (!chartView) return [];
    return chartView.yPriceLevels.map(({ price, svgY }) => ({
      price,
      top: Math.max(0, (svgY / SVG_H) * chartAreaHeight - 8),
    }));
  }, [chartView, chartAreaHeight]);

  const handlePointer = useCallback((xPx: number) => {
    if (!chartView) return;
    const ratio  = Math.max(0, Math.min(1, xPx / Math.max(1, chartPixelWidth)));
    const maxIdx = chartView.points.length - 1;
    setHoverIndex(Math.max(0, Math.min(maxIdx, Math.round(ratio * maxIdx))));
  }, [chartView, chartPixelWidth]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* Header: price + change */}
        <View style={styles.headerRow}>
          <View>
            {isLoading ? (
              <View>
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
                  <View style={[styles.changeBadge, isPositive ? styles.changeBadgeUp : styles.changeBadgeDn]}>
                    <Text style={[styles.changeBadgeText, isPositive ? styles.changeUp : styles.changeDn]}>
                      {displayAbsChange}
                    </Text>
                  </View>
                  <Text style={[styles.statsText, isPositive ? styles.changeUp : styles.changeDn]}>
                    {displayPctChange}
                  </Text>
                </View>
              </>
            )}
          </View>
          <Text style={styles.periodLabel}>{t('marketCap.today')}</Text>
        </View>

        {/* Range tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rangeTabsScroll}
          contentContainerStyle={styles.rangeTabs}
        >
          {RANGE_TABS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeTab, activeRange === r && styles.rangeTabActive]}
              onPress={() => setActiveRange(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeTabText, activeRange === r && styles.rangeTabTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <View
          style={[styles.chartWrapper, { height: chartAreaHeight }]}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setChartPixelWidth(w);
          }}
        >
          {isLoading && !chartView ? (
            <View style={[styles.chartSkeleton, { height: chartAreaHeight }]} />
          ) : chartView ? (
            <>
              {/* Isolated SVG — re-renders only when chart data or hover changes */}
              <ChartSvg
                view={chartView}
                gradientId={gradientId}
                isDark={isDark}
                activePoint={activePoint}
              />

              {/* Y-axis price labels */}
              <View style={[styles.yAxisOverlay, { height: chartAreaHeight }]}>
                {yLabelPositions.map(({ price, top }, i) => (
                  <Text key={i} style={[styles.yAxisLabel, { top }]}>
                    {fmtMarketShort(price)}
                  </Text>
                ))}
              </View>

              {/* Hover price label */}
              {activeKline && hoverLabelPos ? (
                <View style={[styles.hoverLabel, {
                  left: hoverLabelPos.left,
                  top: hoverLabelPos.top,
                  width: hoverLabelPos.width,
                }]}>
                  <Text style={styles.hoverLabelTime}>
                    {formatTimeLabel(activeKline.openTime)}
                  </Text>
                  <Text style={styles.hoverLabelPrice}>
                    {fmtMarketShort(activeKline.close)}
                  </Text>
                </View>
              ) : null}

              {/* Touch / hover interaction layer */}
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

              {/* X-axis time labels */}
              <View style={styles.xAxisLabels}>
                {chartView.xLabels.map((label, i) => (
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

        {/* Stats grid (2×2) */}
        <View style={styles.statsGrid}>
          {[
            { label: '24h High', value: fmtMarketShort(data.high24h), color: GREEN },
            { label: '24h Low',  value: fmtMarketShort(data.low24h),  color: RED   },
            { label: 'Change',   value: displayAbsChange,             color: isPositive ? GREEN : RED },
            { label: 'Mkt Cap',  value: displayCap,                   color: null  },
          ].map(({ label, value, color }, i) => (
            <View key={i} style={styles.statCell}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
            </View>
          ))}
        </View>

      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
function buildStyles(tokens: ThemeTokens) {
  const { spacing: s, borderRadius: br, typography: typo } = tokens;

  return StyleSheet.create({
    container: { marginBottom: 0 },
    card: {
      backgroundColor: BG_CARD,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingTop: s.lg,
      paddingHorizontal: s.lg,
      paddingBottom: s.md,
      overflow: 'hidden',
    },

    // Header
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
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      marginTop: s.xs,
    },
    changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    changeBadgeUp: { backgroundColor: 'rgba(39,196,133,0.13)' },
    changeBadgeDn: { backgroundColor: 'rgba(240,82,82,0.13)'  },
    changeBadgeText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    statsText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    changeUp: { color: GREEN },
    changeDn: { color: RED   },
    periodLabel: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: TEXT_DIM,
      textTransform: 'uppercase',
      letterSpacing: typo.letterSpacing.eyebrow,
      alignSelf: 'flex-start',
      marginTop: 4,
    },

    // Range tabs
    rangeTabsScroll: { marginHorizontal: -s.lg, marginBottom: s.sm },
    rangeTabs: { flexDirection: 'row', gap: 4, paddingHorizontal: s.lg },
    rangeTab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    rangeTabActive: { backgroundColor: 'rgba(99,131,255,0.18)' },
    rangeTabText: {
      fontSize: 12,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      color: TEXT_MID,
    },
    rangeTabTextActive: { color: LINE_COLOR },

    // Chart
    chartWrapper:  { width: '100%', marginTop: s.xs, position: 'relative' },
    chartSkeleton: {
      width: '100%',
      borderRadius: br.md,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    yAxisOverlay: { position: 'absolute', left: 0, top: 0, width: 68 },
    yAxisLabel: {
      position: 'absolute',
      fontSize: typo.fontSizes.badge,
      color: TEXT_DIM,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    hoverLabel: {
      position: 'absolute',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: br.sm,
      backgroundColor: 'rgba(10,10,15,0.88)',
      borderWidth: 0.5,
      borderColor: 'rgba(99,131,255,0.30)',
      alignItems: 'center',
    },
    hoverLabelTime: {
      fontSize: typo.fontSizes.badge,
      color: TEXT_MID,
      fontFamily: typo.fontFamilies.sans,
    },
    hoverLabelPrice: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: '#fafafa',
      fontVariant: ['tabular-nums'],
      marginTop: 1,
    },
    interactionLayer: { position: 'absolute', left: 0, right: 0, top: 0 },
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
      color: TEXT_DIM,
      letterSpacing: typo.letterSpacing.caption,
    },
    noDataText: {
      color: TEXT_DIM,
      fontSize: typo.fontSizes.xs,
      fontFamily: typo.fontFamilies.sans,
      textAlign: 'center',
      marginTop: 50,
    },

    // Stats grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: s.md,
      borderRadius: br.md,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: BORDER_DIM,
      backgroundColor: BORDER_DIM,
      gap: 0.5,
    },
    statCell: {
      width: '50%',
      backgroundColor: BG_SURFACE,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    statLabel: {
      fontSize: 10,
      color: TEXT_DIM,
      fontFamily: typo.fontFamilies.sans,
      marginBottom: 3,
    },
    statValue: {
      fontSize: 14,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      color: 'rgba(255,255,255,0.85)',
      fontVariant: ['tabular-nums'],
    },

    // Skeleton
    skeletonBlock: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: br.sm },
    titleSkeleton: { width: 140, height: 34, marginBottom: 6 },
    statSkeleton:  { width: 64,  height: 14 },
  });
}
