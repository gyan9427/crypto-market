import type { ReactNode } from 'react';
import React, { memo, useEffect, useRef } from 'react';
import { Animated as RNAnimated, Easing, StyleSheet, View } from 'react-native';
import { ILLUSTRATION_SLOT_HEIGHT } from '../constants/onboardingData';

const LOOP_MS = 3200;

export interface AnimatedIllustrationProps {
  children: ReactNode;
}

/**
 * Reanimated is known to crash on Android (Expo Go) in this project.
 * Use RN Animated here to keep onboarding stable and flicker-free.
 */
function AnimatedIllustrationInner({ children }: AnimatedIllustrationProps) {
  const t = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    t.setValue(0);
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(t, {
          toValue: 1,
          duration: LOOP_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(t, {
          toValue: 0,
          duration: LOOP_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [t]);

  const animatedStyle = {
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }),
    transform: [
      { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
      { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }) },
    ],
  } as const;

  return (
    <View style={styles.slot}>
      <RNAnimated.View style={[styles.inner, animatedStyle]}>{children}</RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: ILLUSTRATION_SLOT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AnimatedIllustration = memo(AnimatedIllustrationInner);
