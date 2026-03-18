import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

interface SparklineChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

function buildSparklinePath(
  data: number[],
  width: number,
  height: number
) {
  if (data.length < 2) return null;
  const path = Skia.Path.Make();
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (width - 1) / (data.length - 1);

  path.moveTo(0, height - ((data[0] - min) / range) * height);
  for (let i = 1; i < data.length; i++) {
    const x = i * stepX;
    const y = height - ((data[i] - min) / range) * height;
    path.lineTo(x, y);
  }
  return path;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color,
  width = 60,
  height = 24,
}) => {
  const path = useMemo(
    () => (data.length >= 2 ? buildSparklinePath(data, width, height) : null),
    [data, width, height]
  );

  if (!path || data.length < 2) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  return (
    <Canvas style={[styles.canvas, { width, height }]}>
      <Path path={path} color={color} style="stroke" strokeWidth={1.5} />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: 'transparent',
  },
});
