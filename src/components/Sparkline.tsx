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

function areSparklinePropsEqual(prev: SparklineProps, next: SparklineProps): boolean {
  if (prev.width !== next.width || prev.height !== next.height) return false;
  if (prev.lineColor !== next.lineColor || prev.isPositive !== next.isPositive) return false;
  const a = prev.data;
  const b = next.data;
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const Sparkline = React.memo<SparklineProps>(({
  data,
  width = 60,
  height = 24,
  lineColor,
  isPositive = true,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildSparklineStyles(), []);

  const points = useMemo(() => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!points) {
    return <View style={[styles.container, { width, height }]} />;
  }

  const c = tokens.colors;
  const color = lineColor || (isPositive ? c.success[500] : c.danger[500]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}, areSparklinePropsEqual);

function buildSparklineStyles() {
  return StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
