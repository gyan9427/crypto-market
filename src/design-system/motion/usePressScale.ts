import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function usePressScale(activeScale = 0.98) {
  const { tokens } = useAppTheme();
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withTiming(activeScale, {
      duration: tokens.motion.duration.instant,
    });
  }, [activeScale, scale, tokens.motion.duration.instant]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: tokens.motion.duration.fast,
    });
  }, [scale, tokens.motion.duration.fast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}
