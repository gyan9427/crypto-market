import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { Maximize2, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';
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
      (acc, p, i) => `${acc}${i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`}`,
      ''
    );
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

    return { linePath, markerX: marker.x, markerY: marker.y, labels, points };
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
          <Text style={styles.periodLabel}>TODAY</Text>
        </View>
        
        {/* Exact Stitch Graph Region */}
        <View
          style={styles.chartWrapper}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            if (width > 0) setChartPixelWidth(width);
          }}
        >
          {isLoading ? (
            <View style={styles.chartSkeleton} />
          ) : chartView ? (
            <>
              <Svg style={styles.svgChart} preserveAspectRatio="none" viewBox="0 0 400 120">
                {/* Dotted Reference Line */}
                <Line stroke="#374151" strokeDasharray="4" strokeWidth="1" x1="0" x2="400" y1="60" y2="60" />
                {/* Main Path (Blue Line Style) */}
                <Path 
                  d={chartView.linePath}
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2.5" 
                />
                {/* Marker */}
                <Circle cx={chartView.markerX} cy={chartView.markerY} fill="#3b82f6" r="4" stroke="white" strokeWidth="2" />
                {activePoint ? (
                  <>
                    <Line
                      x1={activePoint.x}
                      x2={activePoint.x}
                      y1={0}
                      y2={CHART_HEIGHT}
                      stroke={colors.neutral[400]}
                      strokeWidth="1"
                      strokeDasharray="3"
                    />
                    <Line
                      x1={0}
                      x2={CHART_WIDTH}
                      y1={activePoint.y}
                      y2={activePoint.y}
                      stroke={colors.neutral[400]}
                      strokeWidth="1"
                      strokeDasharray="3"
                    />
                    <Circle cx={activePoint.x} cy={activePoint.y} fill="#3b82f6" r="4" stroke="white" strokeWidth="2" />
                  </>
                ) : null}
              </Svg>
              <View
                style={styles.interactionLayer}
                onMouseMove={(e: any) => handlePointer(e.nativeEvent.locationX)}
                onMouseLeave={() => setHoverIndex(null)}
                onStartShouldSetResponder={() => true}
                onResponderGrant={(e: any) => handlePointer(e.nativeEvent.locationX)}
                onResponderMove={(e: any) => handlePointer(e.nativeEvent.locationX)}
                onResponderRelease={() => setHoverIndex(null)}
                onResponderTerminate={() => setHoverIndex(null)}
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
              <Text style={styles.noDataText}>No active market trend</Text>
            </View>
          )}
        </View>

        {/* Utility Icons */}
        <View style={styles.utilitiesRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Maximize2 size={18} color={colors.neutral[400]} />
          </TouchableOpacity>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <MoreHorizontal size={18} color={colors.neutral[400]} />
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.neutral[900],
    borderRadius: 32,
    padding: 24,
    ...shadows.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[50],
    letterSpacing: -0.5,
  },
  headerSkeleton: {
    alignItems: 'flex-start',
  },
  skeletonBlock: {
    backgroundColor: colors.neutral[800],
    borderRadius: 8,
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
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statsText: {
    color: colors.success[500],
    fontSize: 14,
    fontWeight: '500',
  },
  negativeStatsText: {
    color: colors.danger[500],
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartWrapper: {
    height: 128,
    width: '100%',
    marginTop: spacing.md,
    position: 'relative',
  },
  svgChart: {
    width: '100%',
    height: '100%',
  },
  chartSkeleton: {
    width: '100%',
    height: CHART_HEIGHT,
    borderRadius: 12,
    backgroundColor: colors.neutral[800],
  },
  xAxisLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
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
    backgroundColor: colors.neutral[900],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tooltipTime: {
    fontSize: 10,
    color: colors.neutral[300],
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 11,
    color: colors.neutral[50],
    fontWeight: '600',
  },
  xLabel: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  noDataText: {
    color: colors.neutral[500],
    fontSize: 12,
    textAlign: 'center',
    marginTop: 50,
  },
  utilitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  iconButton: {
    padding: 8,
    backgroundColor: colors.neutral[800],
    borderRadius: 8,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryIconButton: {
    padding: 8,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
  },
});
