import React from 'react';
import { View, useWindowDimensions, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { spacing } from '../../theme/theme';
import { colors } from '../../theme/theme';
import { CHART_HEIGHT } from '../constants';
import type { ChartDataPoint } from '../types';

interface PriceLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showDataPoints?: boolean;
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

export const PriceLineChart: React.FC<PriceLineChartProps> = ({
  data,
  height = CHART_HEIGHT,
  color = colors.primary[500],
  showDataPoints = false,
}) => {
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.md * 4;

  if (data.length === 0) {
    return (
      <View style={[placeholderStyles.container, { minHeight: height - 24 }]}>
        <Text style={placeholderStyles.text}>
          Chart data will appear once available
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
      <LineChart
        data={data}
        width={chartWidth}
        height={height - 24}
        color={color}
        hideDataPoints={!showDataPoints}
        dataPointsColor={color}
        thickness={2}
        hideRules
        hideYAxisText
        xAxisLabelTextStyle={{ fontSize: 10, color: colors.neutral[500] }}
      />
    </View>
  );
};
