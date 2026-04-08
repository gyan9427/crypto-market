import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  lineColor?: string;
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 24,
  lineColor,
  isPositive = true,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildSparklineStyles(), []);

  if (!data || data.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const c = tokens.colors;
  const color = lineColor || (isPositive ? c.success[500] : c.danger[500]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
      </Svg>
    </View>
  );
};

function buildSparklineStyles() {
  return StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
