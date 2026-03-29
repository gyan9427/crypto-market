import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

function buildPoints(data: number[], width: number, height: number): string | null {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (width - 1) / (data.length - 1);
  const parts: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const x = i * stepX;
    const y = height - ((data[i] - min) / range) * height;
    parts.push(`${x},${y}`);
  }
  return parts.join(' ');
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color,
  width = 60,
  height = 24,
}) => {
  const points = useMemo(
    () => (data.length >= 2 ? buildPoints(data, width, height) : null),
    [data, width, height]
  );

  if (!points || data.length < 2) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  return (
    <Svg width={width} height={height} style={styles.svg}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: 'transparent',
  },
});
