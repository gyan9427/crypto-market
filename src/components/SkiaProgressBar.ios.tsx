import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Canvas, RoundedRect, Fill } from '@shopify/react-native-skia';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface SkiaProgressBarProps {
  fillRatio: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  borderRadius?: number;
}

/** iOS: Skia canvas (Reanimated/Skia stack stable here). */
export const SkiaProgressBar: React.FC<SkiaProgressBarProps> = ({
  fillRatio,
  height = 6,
  trackColor,
  fillColor,
  borderRadius = 3,
}) => {
  const { tokens } = useAppTheme();
  const resolvedTrack = trackColor ?? tokens.borderSubtle;
  const resolvedFill = fillColor ?? tokens.colors.primary[500];
  const [width, setWidth] = useState(0);
  const ratio = Math.max(0, Math.min(1, fillRatio));
  const fillWidth = width * ratio;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  const canvasStyle = StyleSheet.flatten([styles.canvas, { width, height }]);

  if (width <= 0) {
    return (
      <View style={[styles.container, { height }]} onLayout={onLayout}>
        <View style={[styles.fallback, { height, backgroundColor: resolvedTrack, borderRadius }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      <Canvas style={canvasStyle}>
        <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
          <Fill color={resolvedTrack} />
        </RoundedRect>
        {fillWidth > 0 && (
          <RoundedRect x={0} y={0} width={fillWidth} height={height} r={borderRadius}>
            <Fill color={resolvedFill} />
          </RoundedRect>
        )}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 40,
  },
  canvas: {
    overflow: 'hidden',
  },
  fallback: {
    flex: 1,
  },
});
