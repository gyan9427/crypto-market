import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { KlineInterval } from '../types';
import { useKlinesCacheState } from '../../hooks/useKlinesCache';
import { colors } from '../../theme/theme';

const SkiaChart = lazy(() => import('./SkiaChart'));
const WEB_CHART_HEIGHT = 168;

export interface ProfessionalChartProps {
  symbol: string;
  interval: KlineInterval;
  style?: object;
}

function UniversalLineChart({ symbol, interval, style }: ProfessionalChartProps) {
  const isFocused = useIsFocused();
  const limit = interval === '1m' ? 240 : 72;
  const { data, isLoading, hasFetched } = useKlinesCacheState(symbol, interval, limit, {
    enabled: isFocused,
  });
  const [width, setWidth] = useState(0);
  const height = WEB_CHART_HEIGHT;
  const padding = 10;
  const chartData = data;

  const { linePath, areaPath, strokeColor } = useMemo(() => {
    if (chartData.length < 2 || width <= 0) {
      return { linePath: '', areaPath: '', strokeColor: '#64748b' };
    }

    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    const innerW = Math.max(1, width - padding * 2);
    const innerH = Math.max(1, height - padding * 2);
    const stepX = innerW / (chartData.length - 1);

    const points = chartData.map((value, index) => {
      const x = padding + index * stepX;
      const y = padding + (1 - (value - min) / range) * innerH;
      return { x, y };
    });

    const line = points.reduce(
      (acc, point, index) => `${acc}${index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`}`,
      ''
    );

    const area = `${line} L ${padding + innerW} ${height - padding} L ${padding} ${height - padding} Z`;
    const stroke = chartData[chartData.length - 1] >= chartData[0] ? '#16a34a' : '#dc2626';

    return { linePath: line, areaPath: area, strokeColor: stroke };
  }, [chartData, width]);

  return (
    <View
      style={[styles.webFallback, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && linePath ? (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={strokeColor} stopOpacity="0.24" />
              <Stop offset="1" stopColor={strokeColor} stopOpacity="0.03" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#lineFill)" />
          <Path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.25} strokeLinecap="round" />
        </Svg>
      ) : (
        <View style={styles.chartSkeleton}>
          {isLoading ? <Text style={styles.stateText}>Loading chart...</Text> : null}
          {!isLoading && hasFetched ? <Text style={styles.stateText}>No market data</Text> : null}
        </View>
      )}
    </View>
  );
}

export function ProfessionalChart(props: ProfessionalChartProps) {
  // Reanimated + GestureHandler chart has stability issues on web/Android.
  // Use a lightweight SVG line chart there so all devices see chart data.
  if (Platform.OS === 'web' || Platform.OS === 'android') {
    return <UniversalLineChart {...props} />;
  }
  return (
    <Suspense fallback={<View style={[styles.webFallback, props.style]} />}>
      <SkiaChart {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    minHeight: WEB_CHART_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#f8fafc',
  },
  chartSkeleton: {
    flex: 1,
    margin: 10,
    borderRadius: 12,
    backgroundColor: '#eef2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
});
