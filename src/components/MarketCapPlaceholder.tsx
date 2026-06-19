import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Line,
  Path,
  Circle,
  Rect,
} from 'react-native-svg';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLiveMarketOverview } from '../hooks/useLiveMarketOverview';
import { getMarketCapChartColors } from './market/marketCapChartColors';
import {
  buildMarketCapStyles,
  MARKET_CAP_Y_AXIS_W,
} from './market/marketCapStyles';

// ─── SVG coordinate space ────────────────────────────────────────────────────
const SVG_W      = 400;
const SVG_H      = 120;
const PAD        = 6;
const INNER_W    = SVG_W - PAD * 2;
const INNER_H    = SVG_H - PAD * 2;
const Y_AXIS_W = MARKET_CAP_Y_AXIS_W;
const Y_TICK_COUNT = 5;  // number of y-axis price levels

// ─── Range tabs ───────────────────────────────────────────────────────────────
const RANGE_TABS = ['1H', '1D', '1W', '1M', '3M', '1Y'] as const;
type RangeTab = (typeof RANGE_TABS)[number];

import type { KlineInterval, KlineRecord } from '@/src/types/kline';

interface RangeConfig {
  interval: KlineInterval;
  limit: number;
  periodLabel: string;
  statPrefix: string;
}

const RANGE_CONFIG: Record<RangeTab, RangeConfig> = {
  '1H': { interval: '1m',  limit: 60,  periodLabel: 'PAST 1H', statPrefix: '1H'  },
  '1D': { interval: '5m',  limit: 288, periodLabel: 'TODAY',   statPrefix: '1D'  },
  '1W': { interval: '1h',  limit: 168, periodLabel: 'PAST 1W', statPrefix: '1W'  },
  '1M': { interval: '4h',  limit: 180, periodLabel: 'PAST 1M', statPrefix: '1M'  },
  '3M': { interval: '1d',  limit: 90,  periodLabel: 'PAST 3M', statPrefix: '3M'  },
  '1Y': { interval: '1w',  limit: 52,  periodLabel: 'PAST 1Y', statPrefix: '1Y'  },
};

// Coarser intervals for candle mode — keeps candle count readable
const CANDLE_RANGE_CONFIG: Record<RangeTab, RangeConfig> = {
  '1H': { interval: '5m', limit: 12,  periodLabel: 'PAST 1H', statPrefix: '1H' },
  '1D': { interval: '1h', limit: 24,  periodLabel: 'TODAY',   statPrefix: '1D' },
  '1W': { interval: '4h', limit: 42,  periodLabel: 'PAST 1W', statPrefix: '1W' },
  '1M': { interval: '1d', limit: 30,  periodLabel: 'PAST 1M', statPrefix: '1M' },
  '3M': { interval: '1d', limit: 90,  periodLabel: 'PAST 3M', statPrefix: '3M' },
  '1Y': { interval: '1w', limit: 52,  periodLabel: 'PAST 1Y', statPrefix: '1Y' },
};

// Minimum slot / point width in SVG units — drives scroll expansion
const MIN_CANDLE_SLOT_SVG = 8;
const MIN_LINE_POINT_SVG  = 3;

// Live-edge scroll positioning (TradingView-style)
const LIVE_POINT_VIEWPORT_RATIO = 0.75;
const TRAILING_VIEWPORT_RATIO   = 0.25;
const LIVE_EDGE_THRESHOLD_PX    = 20;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatXLabel(openTime: string | number | Date, range: RangeTab): string {
  const date = openTime instanceof Date ? openTime : new Date(openTime);
  if (Number.isNaN(date.getTime())) return '--';
  const h  = date.getHours();
  const hr = h % 12 === 0 ? 12 : h % 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const m  = date.getMinutes();

  if (range === '1H' || range === '1D') {
    return `${hr}:${`${m}`.padStart(2, '0')}${ampm}`;
  }
  if (range === '1W') {
    return `${DAYS[date.getDay()]} ${hr}${ampm}`;
  }
  if (range === '1M' || range === '3M') {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  }
  // 1Y
  return MONTHS[date.getMonth()];
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
  totalSvgW: number;
  gradientId: string;
  isDark: boolean;
  lineColor: string;
  activePoint: { x: number; y: number } | null;
  crosshairStroke: string;
  markerStroke: string;
  gridStroke: string;
}

function ChartSvg({
  view,
  totalSvgW,
  gradientId,
  isDark,
  lineColor,
  activePoint,
  crosshairStroke,
  markerStroke,
  gridStroke,
}: ChartSvgProps) {
  return (
  <Svg
    style={svgStyle}
    preserveAspectRatio="none"
    viewBox={`0 0 ${totalSvgW} ${SVG_H}`}
  >
    <Defs>
      <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0"   stopColor={lineColor} stopOpacity={isDark ? 0.45 : 0.25} />
        <Stop offset="0.6" stopColor={lineColor} stopOpacity={isDark ? 0.12 : 0.05} />
        <Stop offset="1"   stopColor={lineColor} stopOpacity="0" />
      </LinearGradient>
    </Defs>

    {/* Horizontal grid lines at each y-tick */}
    {view.yPriceLevels.map(({ svgY }, i) => (
      <Line
        key={i}
        x1={0} x2={totalSvgW}
        y1={svgY} y2={svgY}
        stroke={gridStroke}
        strokeWidth="0.5"
        strokeDasharray="3 4"
      />
    ))}

    {/* Area gradient fill */}
    <Path d={view.areaPath} fill={`url(#${gradientId})`} />

    {/* Price curve */}
    <Path
      d={view.linePath}
      fill="none"
      stroke={lineColor}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />

    {/* Live dot at end of curve */}
    <Circle
      cx={view.lastPoint.x}
      cy={view.lastPoint.y}
      r={3.5}
      fill={lineColor}
      stroke={markerStroke}
      strokeWidth="1.5"
    />

    {/* Hover crosshair */}
    {activePoint ? (
      <>
        <Line
          x1={activePoint.x} x2={activePoint.x}
          y1={0} y2={SVG_H}
          stroke={crosshairStroke}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <Circle
          cx={activePoint.x}
          cy={activePoint.y}
          r={4}
          fill={lineColor}
          stroke={markerStroke}
          strokeWidth="2"
        />
      </>
    ) : null}
  </Svg>
  );
}
ChartSvg.displayName = 'ChartSvg';
const MemoChartSvg = memo(ChartSvg);

const svgStyle = { width: '100%' as const, height: '100%' as const };

// ─── Chart-type icons ─────────────────────────────────────────────────────────
function LineIcon({ color }: { color: string }) {
  return (
  <Svg width={16} height={16} viewBox="0 0 16 16">
    <Path
      d="M1 12 L5 6 L9 9 L15 3"
      stroke={color}
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  );
}
LineIcon.displayName = 'LineIcon';
const MemoLineIcon = memo(LineIcon);

function CandleIcon({
  color,
  green,
  red,
}: {
  color: string;
  green: string;
  red: string;
}) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Line x1="5" y1="2" x2="5" y2="14" stroke={color} strokeWidth="1.2" />
      <Rect x="3" y="5" width="4" height="5" fill={red} rx="0.5" />
      <Line x1="11" y1="3" x2="11" y2="13" stroke={color} strokeWidth="1.2" />
      <Rect x="9" y="6" width="4" height="5" fill={green} rx="0.5" />
    </Svg>
  );
}
CandleIcon.displayName = 'CandleIcon';
const MemoCandleIcon = memo(CandleIcon);

// ─── Candlestick SVG ──────────────────────────────────────────────────────────
interface CandleSvgProps {
  klines: KlineRecord[];
  green: string;
  red: string;
  gridStroke: string;
  activeIndex: number | null;
  crosshairStroke: string;
  totalSvgW: number;
}

function CandleSvg({
  klines,
  green,
  red,
  gridStroke,
  activeIndex,
  crosshairStroke,
  totalSvgW,
}: CandleSvgProps) {
  const n = klines.length;
  if (n === 0) return null;

  const innerW  = totalSvgW - PAD * 2;
  const slotW   = innerW / n;
  const bodyW   = Math.max(2, slotW * 0.6);

  const minVal  = Math.min(...klines.map(k => k.low));
  const maxVal  = Math.max(...klines.map(k => k.high));
  const range   = maxVal - minVal || 1;
  const mapY    = (v: number) => PAD + INNER_H - ((v - minVal) / range) * INNER_H;

  const yGrid   = Array.from({ length: Y_TICK_COUNT }, (_, i) =>
    PAD + (i / (Y_TICK_COUNT - 1)) * INNER_H,
  );

  const crosshairX = activeIndex !== null
    ? PAD + activeIndex * slotW + slotW / 2
    : null;

  return (
    <Svg style={svgStyle} preserveAspectRatio="none" viewBox={`0 0 ${totalSvgW} ${SVG_H}`}>
      {yGrid.map((svgY, i) => (
        <Line key={i} x1={0} x2={totalSvgW} y1={svgY} y2={svgY}
              stroke={gridStroke} strokeWidth="0.5" strokeDasharray="3 4" />
      ))}

      {klines.map((k, i) => {
        const cx      = PAD + i * slotW + slotW / 2;
        const highY   = mapY(k.high);
        const lowY    = mapY(k.low);
        const openY   = mapY(k.open);
        const closeY  = mapY(k.close);
        const color   = k.close >= k.open ? green : red;
        const bodyTop = Math.min(openY, closeY);
        const bodyH   = Math.max(1.5, Math.abs(closeY - openY));
        return (
          <React.Fragment key={i}>
            <Line x1={cx} x2={cx} y1={highY} y2={lowY} stroke={color} strokeWidth="1.2" />
            <Rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH}
                  fill={color} opacity={0.92} />
          </React.Fragment>
        );
      })}

      {crosshairX !== null ? (
        <Line x1={crosshairX} x2={crosshairX} y1={0} y2={SVG_H}
              stroke={crosshairStroke} strokeWidth="1" strokeDasharray="3 3" />
      ) : null}
    </Svg>
  );
}
CandleSvg.displayName = 'CandleSvg';
const MemoCandleSvg = memo(CandleSvg);

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
  const chartColors = useMemo(() => getMarketCapChartColors(tokens), [tokens]);
  const styles = useMemo(
    () => buildMarketCapStyles(tokens, chartColors),
    [tokens, chartColors]
  );
  const chartCrosshairStroke = chartColors.crosshair;
  const chartMarkerStroke = chartColors.marker;
  const chartGridStroke = chartColors.grid;

  const gradientId = useRef(`mcpGrad_${Math.random().toString(36).slice(2, 8)}`).current;

  const { height: screenHeight } = useWindowDimensions();
  const chartAreaHeight = Math.round(screenHeight * 0.26);

  const [activeRange, setActiveRange]         = useState<RangeTab>('1D');
  const [chartType, setChartType]             = useState<'line' | 'candle'>('line');
  const [hoverIndex, setHoverIndex]           = useState<number | null>(null);
  const [chartPixelWidth, setChartPixelWidth] = useState(SVG_W);
  const [scrollOffset, setScrollOffset]       = useState(0);
  const [isAtLiveEdge, setIsAtLiveEdge]         = useState(true);

  const chartScrollRef   = useRef<ScrollView>(null);
  const scrollOffsetRef  = useRef(0);
  const followLiveRef    = useRef(true);
  const pointerScreenX   = useRef(0);

  const rangeConfig = (chartType === 'candle' ? CANDLE_RANGE_CONFIG : RANGE_CONFIG)[activeRange];
  const { data, hasFetched } = useLiveMarketOverview({
    enabled: liveUpdatesEnabled,
    interval: rangeConfig.interval,
    limit:    rangeConfig.limit,
  });
  const klines     = data.klines;
  const isLoading  = !hasFetched;
  const isPositive = data.absoluteChange24h >= 0;

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
  const lineTotalSvgW = useMemo(
    () => Math.max(SVG_W, (Math.max(klines.length, 2) - 1) * MIN_LINE_POINT_SVG + PAD * 2),
    [klines.length],
  );

  const freshChartView = useMemo<ChartView | null>(() => {
    if (klines.length < 2) return null;

    const closes = klines.map((k) => k.close);
    const min    = Math.min(...closes);
    const max    = Math.max(...closes);
    const range  = max - min || 1;
    const innerW = lineTotalSvgW - PAD * 2;
    const stepX  = innerW / Math.max(closes.length - 1, 1);

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
    ].map((i) => formatXLabel(klines[i].openTime, activeRange));

    const yPriceLevels = Array.from({ length: Y_TICK_COUNT }, (_, i) => {
      const t = i / (Y_TICK_COUNT - 1);
      return { price: max - t * range, svgY: PAD + t * INNER_H };
    });

    return { linePath, areaPath, points, xLabels, yPriceLevels, lastPoint: points[points.length - 1] };
  }, [klines, activeRange, lineTotalSvgW]);

  // Keep the last valid chartView so the chart never flashes blank during updates.
  const lastChartViewRef = useRef<ChartView | null>(null);
  if (freshChartView) lastChartViewRef.current = freshChartView;
  const chartView = lastChartViewRef.current;

  // ── Hover state ─────────────────────────────────────────────────────────────
  const activePoint = chartView && hoverIndex !== null ? chartView.points[hoverIndex] : null;
  const activeKline = hoverIndex !== null ? klines[hoverIndex] : null;

  // ── Scroll sizing (line + candle) ───────────────────────────────────────────
  const candleTotalSvgW = Math.max(SVG_W, klines.length * MIN_CANDLE_SLOT_SVG);
  const chartTotalSvgW  = chartType === 'line' ? lineTotalSvgW : candleTotalSvgW;
  const chartTotalPixelW = Math.round((chartTotalSvgW / SVG_W) * chartPixelWidth);
  const trailingPadPx    = Math.round(chartPixelWidth * TRAILING_VIEWPORT_RATIO);

  const lastPointSvgX = useMemo(() => {
    if (chartType === 'line') {
      return chartView?.lastPoint.x ?? 0;
    }
    if (klines.length === 0) return 0;
    const innerW = chartTotalSvgW - PAD * 2;
    const slotW  = innerW / klines.length;
    return PAD + (klines.length - 1) * slotW + slotW / 2;
  }, [chartType, chartView, klines.length, chartTotalSvgW]);

  const lastPointPixelX = (lastPointSvgX / chartTotalSvgW) * chartTotalPixelW;

  const scrollContentWidth = Math.max(
    chartTotalPixelW + trailingPadPx,
    Math.round(lastPointPixelX + trailingPadPx),
  );

  const needsChartScroll = scrollContentWidth > chartPixelWidth + 1;

  const computeLiveScrollOffset = useCallback(() => {
    if (chartPixelWidth <= 0) return 0;
    return Math.max(0, lastPointPixelX - chartPixelWidth * LIVE_POINT_VIEWPORT_RATIO);
  }, [chartPixelWidth, lastPointPixelX]);

  const scrollToLive = useCallback((animated = true) => {
    const offset = computeLiveScrollOffset();
    followLiveRef.current = true;
    setIsAtLiveEdge(true);
    scrollOffsetRef.current = offset;
    setScrollOffset(offset);
    chartScrollRef.current?.scrollTo({ x: offset, animated });
  }, [computeLiveScrollOffset]);

  // Re-enable live follow when range or chart type changes
  useEffect(() => {
    followLiveRef.current = true;
    setIsAtLiveEdge(true);
  }, [activeRange, chartType]);

  // Auto-scroll to live edge while following
  const latestClose = klines.length > 0 ? klines[klines.length - 1].close : 0;
  useEffect(() => {
    if (!followLiveRef.current || !chartView) return;
    const offset = computeLiveScrollOffset();
    scrollOffsetRef.current = offset;
    setScrollOffset(offset);
    chartScrollRef.current?.scrollTo({ x: offset, animated: false });
  }, [
    latestClose,
    klines.length,
    chartPixelWidth,
    scrollContentWidth,
    chartType,
    activeRange,
    chartView,
    computeLiveScrollOffset,
  ]);

  const handleChartScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      scrollOffsetRef.current = offset;
      setScrollOffset(offset);

      const liveOffset = computeLiveScrollOffset();
      const atLive = Math.abs(offset - liveOffset) <= LIVE_EDGE_THRESHOLD_PX;
      followLiveRef.current = atLive;
      setIsAtLiveEdge(atLive);
    },
    [computeLiveScrollOffset],
  );

  const handleChartPointer = useCallback(
    (contentX: number, viewportX: number) => {
      pointerScreenX.current = viewportX;
      if (chartType === 'line') {
        if (!chartView) return;
        const ratio  = Math.max(0, Math.min(1, contentX / Math.max(1, chartTotalPixelW)));
        const maxIdx = chartView.points.length - 1;
        setHoverIndex(Math.max(0, Math.min(maxIdx, Math.round(ratio * maxIdx))));
        return;
      }
      if (!klines.length) return;
      const idx = Math.round((contentX / Math.max(1, chartTotalPixelW)) * (klines.length - 1));
      setHoverIndex(Math.max(0, Math.min(klines.length - 1, idx)));
    },
    [chartType, chartView, chartTotalPixelW, klines.length],
  );

  const hoverLabelPos = useMemo(() => {
    if (!activePoint) return null;
    const pointPxContent = (activePoint.x / lineTotalSvgW) * chartTotalPixelW;
    const px = pointPxContent - scrollOffset;
    const py = (activePoint.y / SVG_H) * chartAreaHeight;
    const w  = 90;
    return {
      left: Math.min(Math.max(px - w / 2, 4), chartPixelWidth - w - 4),
      top:  Math.max(py - 32, 4),
      width: w,
    };
  }, [activePoint, lineTotalSvgW, chartTotalPixelW, scrollOffset, chartPixelWidth, chartAreaHeight]);

  const candleHoverPos = useMemo(() => {
    if (hoverIndex === null || klines.length === 0) return null;
    const w = 116;
    return {
      left: Math.min(Math.max(pointerScreenX.current - w / 2, 4), chartPixelWidth - w - 4),
      top: 4,
      width: w,
    };
  }, [hoverIndex, klines.length, chartPixelWidth, scrollOffset]);

  const yLabelPositions = useMemo(() => {
    if (!chartView) return [];
    return chartView.yPriceLevels.map(({ price, svgY }) => ({
      price,
      top: Math.max(0, (svgY / SVG_H) * chartAreaHeight - 8),
    }));
  }, [chartView, chartAreaHeight]);

  // ── Candle y-axis / x-axis labels ───────────────────────────────────────────
  const candleYLabelPositions = useMemo(() => {
    if (klines.length === 0) return [];
    const minVal = Math.min(...klines.map(k => k.low));
    const maxVal = Math.max(...klines.map(k => k.high));
    const range  = maxVal - minVal || 1;
    return Array.from({ length: Y_TICK_COUNT }, (_, i) => {
      const t = i / (Y_TICK_COUNT - 1);
      return {
        price: maxVal - t * range,
        top:   Math.max(0, (PAD + t * INNER_H) / SVG_H * chartAreaHeight - 8),
      };
    });
  }, [klines, chartAreaHeight]);

  const candleXLabels = useMemo(() => {
    if (klines.length === 0) return [];
    const n = klines.length;
    return [0, Math.floor(n * 0.33), Math.floor(n * 0.66), n - 1]
      .map(i => formatXLabel(klines[i].openTime, activeRange));
  }, [klines, activeRange]);

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
          <Text style={styles.periodLabel}>{rangeConfig.periodLabel}</Text>
        </View>

        {/* Range tabs + chart-type toggle */}
        <View style={styles.rangeRow}>
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
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, chartType === 'line' && styles.viewToggleBtnActive]}
              onPress={() => setChartType('line')}
              activeOpacity={0.7}
            >
              <MemoLineIcon color={chartType === 'line' ? chartColors.line : tokens.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, chartType === 'candle' && styles.viewToggleBtnActive]}
              onPress={() => setChartType('candle')}
              activeOpacity={0.7}
            >
              <MemoCandleIcon
                color={chartType === 'candle' ? chartColors.line : tokens.textMuted}
                green={chartColors.green}
                red={chartColors.red}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartRow}>
          {/* Y-axis label column */}
          <View style={[styles.yAxisColumn, { height: chartAreaHeight }]}>
            {(chartType === 'candle' ? candleYLabelPositions : yLabelPositions).map(({ price, top }, i) => (
              <Text key={i} style={[styles.yAxisLabel, { top }]}>
                {fmtMarketShort(price)}
              </Text>
            ))}
          </View>

          {/* SVG + interaction area */}
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
                <ScrollView
                  ref={chartScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  scrollEnabled={needsChartScroll}
                  style={{ height: chartAreaHeight }}
                  contentContainerStyle={{ width: scrollContentWidth }}
                  onScroll={handleChartScroll}
                  onContentSizeChange={() => {
                    if (followLiveRef.current) scrollToLive(false);
                  }}
                >
                  <View style={{ width: scrollContentWidth, height: chartAreaHeight }}>
                    <View style={{ width: chartTotalPixelW, height: chartAreaHeight }}>
                      {chartType === 'line' ? (
                        <MemoChartSvg
                          view={chartView}
                          totalSvgW={lineTotalSvgW}
                          gradientId={gradientId}
                          isDark={isDark}
                          lineColor={chartColors.line}
                          activePoint={activePoint}
                          crosshairStroke={chartCrosshairStroke}
                          markerStroke={chartMarkerStroke}
                          gridStroke={chartGridStroke}
                        />
                      ) : (
                        <MemoCandleSvg
                          klines={klines}
                          green={chartColors.green}
                          red={chartColors.red}
                          gridStroke={chartGridStroke}
                          activeIndex={hoverIndex}
                          crosshairStroke={chartCrosshairStroke}
                          totalSvgW={candleTotalSvgW}
                        />
                      )}
                    </View>

                    {/* Pointer interaction — inside scroll content so horizontal swipes scroll */}
                    <View
                      style={[
                        styles.interactionLayer,
                        { height: chartAreaHeight, width: scrollContentWidth },
                      ]}
                      onTouchStart={(e) => {
                        const contentX = e.nativeEvent.locationX;
                        handleChartPointer(contentX, contentX - scrollOffsetRef.current);
                      }}
                      onTouchEnd={() => setHoverIndex(null)}
                      {...(Platform.OS === 'web'
                        ? {
                            onMouseMove: (e: any) => {
                              const contentX = e.nativeEvent.locationX;
                              handleChartPointer(contentX, contentX - scrollOffsetRef.current);
                            },
                            onMouseLeave: () => setHoverIndex(null),
                          }
                        : {})}
                    />
                  </View>
                </ScrollView>

                {/* Return to live — shown when user scrolls away from the latest point */}
                {needsChartScroll && !isAtLiveEdge ? (
                  <TouchableOpacity
                    style={styles.returnToLiveBtn}
                    onPress={() => scrollToLive(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.returnToLiveText}>{t('marketCap.returnToLive')}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Hover label — close price for line, OHLC for candle */}
                {chartType === 'line' && activeKline && hoverLabelPos ? (
                  <View style={[styles.hoverLabel, {
                    left: hoverLabelPos.left,
                    top: hoverLabelPos.top,
                    width: hoverLabelPos.width,
                  }]}>
                    <Text style={styles.hoverLabelTime}>
                      {formatXLabel(activeKline.openTime, activeRange)}
                    </Text>
                    <Text style={styles.hoverLabelPrice}>
                      {fmtMarketShort(activeKline.close)}
                    </Text>
                  </View>
                ) : chartType === 'candle' && activeKline && candleHoverPos ? (
                  <View style={[styles.hoverLabel, {
                    left: candleHoverPos.left,
                    top: candleHoverPos.top,
                    width: candleHoverPos.width,
                  }]}>
                    <Text style={styles.hoverLabelTime}>
                      {formatXLabel(activeKline.openTime, activeRange)}
                    </Text>
                    <View style={styles.ohlcRow}>
                      <View style={styles.ohlcItem}>
                        <Text style={styles.ohlcLabel}>O</Text>
                        <Text style={styles.ohlcValue}>{fmtMarketShort(activeKline.open)}</Text>
                      </View>
                      <View style={styles.ohlcItem}>
                        <Text style={styles.ohlcLabel}>H</Text>
                        <Text style={[styles.ohlcValue, { color: chartColors.green }]}>{fmtMarketShort(activeKline.high)}</Text>
                      </View>
                    </View>
                    <View style={styles.ohlcRow}>
                      <View style={styles.ohlcItem}>
                        <Text style={styles.ohlcLabel}>L</Text>
                        <Text style={[styles.ohlcValue, { color: chartColors.red }]}>{fmtMarketShort(activeKline.low)}</Text>
                      </View>
                      <View style={styles.ohlcItem}>
                        <Text style={styles.ohlcLabel}>C</Text>
                        <Text style={styles.ohlcValue}>{fmtMarketShort(activeKline.close)}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* X-axis time labels */}
                <View style={styles.xAxisLabels}>
                  {(chartType === 'candle' ? candleXLabels : chartView.xLabels).map((label, i) => (
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
        </View>

        {/* Stats grid (2×2) */}
        <View style={styles.statsGrid}>
          <View style={styles.statsGridRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{rangeConfig.statPrefix} High</Text>
              <Text style={[styles.statValue, { color: chartColors.green }]}>{fmtMarketShort(data.high24h)}</Text>
            </View>
            <View style={styles.statDividerV} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{rangeConfig.statPrefix} Low</Text>
              <Text style={[styles.statValue, { color: chartColors.red }]}>{fmtMarketShort(data.low24h)}</Text>
            </View>
          </View>
          <View style={styles.statDividerH} />
          <View style={styles.statsGridRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{rangeConfig.statPrefix} Change</Text>
              <Text style={[styles.statValue, { color: isPositive ? chartColors.green : chartColors.red }]}>{displayAbsChange}</Text>
            </View>
            <View style={styles.statDividerV} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Mkt Cap</Text>
              <Text style={styles.statValue}>{displayCap}</Text>
            </View>
          </View>
        </View>

      </View>
    </View>
  );
};
