import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { Canvas, RoundedRect, Fill } from '@shopify/react-native-skia';

interface SkiaProgressBarProps {
  fillRatio: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  borderRadius?: number;
}

export const SkiaProgressBar: React.FC<SkiaProgressBarProps> = ({
  fillRatio,
  height = 6,
  trackColor = '#e5e5e5',
  fillColor = '#a855f7',
  borderRadius = 3,
}) => {
  const [width, setWidth] = useState(0);
  const ratio = Math.max(0, Math.min(1, fillRatio));
  const fillWidth = width * ratio;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <View
          style={[
            styles.webTrack,
            { height, borderRadius, backgroundColor: trackColor },
          ]}
        >
          <View
            style={[
              styles.webFill,
              {
                width: `${ratio * 100}%`,
                backgroundColor: fillColor,
                borderRadius,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  // Skia Canvas on web expects a plain style object, not a style array.
  const canvasStyle = StyleSheet.flatten([styles.canvas, { width, height }]);

  if (width <= 0) {
    return (
      <View style={[styles.container, { height }]} onLayout={onLayout}>
        <View style={[styles.fallback, { height }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      <Canvas style={canvasStyle}>
        <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
          <Fill color={trackColor} />
        </RoundedRect>
        {fillWidth > 0 && (
          <RoundedRect x={0} y={0} width={fillWidth} height={height} r={borderRadius}>
            <Fill color={fillColor} />
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
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
  },
  webTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  webFill: {
    height: '100%',
  },
});
