import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { Maximize2, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';
import { fetchKlines, KlineRecord } from '../services/api';

const CHART_WIDTH = 400;
const CHART_HEIGHT = 120;
const DEFAULT_PATH =
  'M0,80 L20,65 L40,90 L60,95 L80,120 L100,60 L120,75 L140,65 L160,90 L180,50 L200,70 L220,40 L240,95 L260,125 L280,100 L300,105 L320,115 L340,90 L360,105 L380,85 L400,95';

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

export const MarketCapPlaceholder: React.FC = () => {
  const [klines, setKlines] = useState<KlineRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchKlines('BTC', '1m', 240);
        if (!cancelled && rows.length > 0) {
          setKlines(rows);
        }
      } catch {
        // Keep existing points on intermittent failures.
      }
    };

    load();
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const chartView = useMemo(() => {
    if (klines.length < 2) {
      return {
        linePath: DEFAULT_PATH,
        markerX: 220,
        markerY: 40,
        labels: ['6.11', '3:00AM', '6:00AM', '9:00AM'],
      };
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

    return { linePath, markerX: marker.x, markerY: marker.y, labels };
  }, [klines]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>$3,428B</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>+1.23B</Text>
              <Text style={styles.statsText}>▲ 24.64%</Text>
            </View>
          </View>
          <Text style={styles.periodLabel}>TODAY</Text>
        </View>
        
        {/* Exact Stitch Graph Region */}
        <View style={styles.chartWrapper}>
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
          </Svg>
          
          {/* X-Axis Labels */}
          <View style={styles.xAxisLabels}>
            <Text style={styles.xLabel}>{chartView.labels[0]}</Text>
            <Text style={styles.xLabel}>{chartView.labels[1]}</Text>
            <Text style={styles.xLabel}>{chartView.labels[2]}</Text>
            <Text style={styles.xLabel}>{chartView.labels[3]}</Text>
          </View>
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
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xLabel: {
    fontSize: 10,
    color: colors.neutral[500],
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
