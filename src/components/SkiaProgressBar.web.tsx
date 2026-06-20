import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface SkiaProgressBarProps {
  fillRatio: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  borderRadius?: number;
}

/** Web: no Skia/Reanimated — avoids loading @shopify/react-native-skia on web. */
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
  const ratio = Math.max(0, Math.min(1, fillRatio));
  return (
    <View style={[styles.container, { height }]}>
      <View
        style={[
          styles.webTrack,
          { height, borderRadius, backgroundColor: resolvedTrack },
        ]}
      >
        <View
          style={[
            styles.webFill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: resolvedFill,
              borderRadius,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 40,
  },
  webTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  webFill: {
    height: '100%',
  },
});
