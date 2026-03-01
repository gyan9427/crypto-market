import React, { useCallback, useState } from 'react';
import { View, useWindowDimensions, Text, StyleSheet, useColorScheme, type LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { spacing } from '../../theme/theme';
import { colors } from '../../theme/theme';
import { CHART_HEIGHT } from '../constants';
import type { ChartDataPoint } from '../types';

interface PriceAreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showDataPoints?: boolean;
  /** Flush layout: no horizontal padding, full width */
  flush?: boolean;
  /** Use light text (for dark backgrounds) */
  darkBackground?: boolean;
}

export const PriceAreaChart: React.FC<PriceAreaChartProps> = ({
  data,
  height = CHART_HEIGHT,
  color = colors.primary[500],
  showDataPoints = false,
  flush = false,
  darkBackground = false,
}) => {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const isDark = colorScheme === 'dark' || darkBackground;
  const resolvedWidth = flush ? containerWidth : width - spacing.md * 4;
  const chartWidth = resolvedWidth ?? width;
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[600];
  const placeholderColor = isDark ? colors.neutral[400] : colors.neutral[500];
  const xAxisColor = isDark ? colors.neutral[300] : colors.neutral[300];
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  }, [containerWidth]);

  if (data.length === 0) {
    return (
      <View style={[styles.placeholder, { minHeight: height - 24 }]}>
        <Text style={[styles.placeholderText, { color: placeholderColor }]}>
          Chart data will appear once available
        </Text>
      </View>
    );
  }

  // For flush layouts, wait for an actual measured width before rendering the chart
  // to avoid oversized first-paint artifacts on mobile.
  if (flush && containerWidth == null) {
    return <View onLayout={handleLayout} style={[styles.chartWrap, styles.chartWrapFlush, { minHeight: height - 24 }]} />;
  }

  return (
    <View onLayout={handleLayout} style={[styles.chartWrap, flush && styles.chartWrapFlush]}>
      <LineChart
        data={data}
        width={chartWidth}
        height={height - 24}
        color={color}
        areaChart
        adjustToWidth
        disableScroll
        hideDataPoints={!showDataPoints}
        dataPointsColor={color}
        thickness={1}
        hideRules
        hideYAxisText
        yAxisThickness={0}
        xAxisThickness={0.75}
        xAxisColor={xAxisColor}
        xAxisLabelTextStyle={{ fontSize: 10, color: labelColor }}
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.35}
        endOpacity={0.1}
        initialSpacing={0}
        endSpacing={0}
        isAnimated={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartWrap: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  chartWrapFlush: {
    paddingHorizontal: 0,
    borderRadius: 0,
  },
});
