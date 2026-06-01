import React, { useEffect, useMemo, useRef } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const SPLASH_HOLD_MS = 2900;
const FADE_OUT_MS = 460;
const LOGO_SPRING_DELAY_MS = Platform.OS === 'web' ? 40 : 0;
/** Narrower gutters so portrait web / phones use more usable width */
const SPLASH_SIDE_GAP = 24;
/** Wordmark bounding width cap - 2.5x increase for maximum visibility */
const LOGO_MAX_WIDTH = 1700;
/** Tall cap — 2.5x increase for prominent display */
const LOGO_MAX_HEIGHT = 550;

const SLOGAN = 'Trade the signal, not the noise.';

const LOGO_LIGHT = require('../../../assets/images/logo.png');
const LOGO_DARK = require('../../../assets/images/logo_dark.png');

/** Direct logo elevation without wrapper pill */
function splashLogoElevation(isDark: boolean): StyleProp<ViewStyle> {
  return Platform.select<ViewStyle>({
    web: {
      // Web uses CSS drop-shadow filter on the Image itself
    },
    ios: {
      shadowColor: isDark ? '#000000' : '#4c1d95',
      shadowOffset: { width: 0, height: isDark ? 24 : 20 },
      shadowOpacity: isDark ? 0.7 : 0.45,
      shadowRadius: isDark ? 48 : 40,
      backgroundColor: 'transparent',
    },
    android: {
      elevation: 24,
      shadowColor: isDark ? '#000000' : '#4c1d95',
    },
    default: { elevation: 24, shadowColor: '#000000' },
  });
}

/** Web-only: silhouettes PNG alpha (`drop-shadow`), not rectangular `box-shadow` artifact */
function webLogoGlyphFilter(isDark: boolean): StyleProp<ImageStyle> {
  if (Platform.OS !== 'web') return {};

  const f = isDark
    ? `drop-shadow(0 24px 48px rgba(0, 0, 0, 0.85)) drop-shadow(0 12px 24px rgba(0, 0, 0, 0.6)) drop-shadow(0 4px 12px rgba(168, 85, 247, 0.4))`
    : `drop-shadow(0 20px 40px rgba(76, 29, 149, 0.4)) drop-shadow(0 10px 24px rgba(147, 51, 234, 0.3)) drop-shadow(0 4px 12px rgba(91, 33, 182, 0.2))`;

  return { filter: f } as StyleProp<ImageStyle>;
}

type Props = {
  onDone: () => void;
};

export function AnimatedSplash({ onDone }: Props) {
  const { effectiveScheme, tokens } = useAppTheme();
  const isDark = effectiveScheme === 'dark';
  const { width: windowWidth } = useWindowDimensions();

  const maxUsableW = Math.max(0, windowWidth - SPLASH_SIDE_GAP * 2);
  const logoW = 1.6 * Math.min(maxUsableW, LOGO_MAX_WIDTH);
  const logoH = 1.6 * Math.min(Math.round(logoW * 0.36), LOGO_MAX_HEIGHT);

  const rootOpacity = useSharedValue(1);

  const logoReveal = useSharedValue(0);
  const logoY = useSharedValue(26);
  const logoScale = useSharedValue(0.94);

  const sloganReveal = useSharedValue(0);
  const sloganY = useSharedValue(18);

  const breath = useSharedValue(1);

  const doneRef = useRef(false);

  const logoSource = isDark ? LOGO_LIGHT : LOGO_DARK;

  const lightGradientColors = [
    '#f3e8ff',
    '#e9d5ff',
    '#d8b4fe',
  ] as const;

  useEffect(() => {
    logoReveal.value = withDelay(
      LOGO_SPRING_DELAY_MS,
      withTiming(1, {
        duration: 780,
        easing: Easing.bezier(0.22, 0.94, 0.28, 1),
      })
    );
    logoY.value = withDelay(
      LOGO_SPRING_DELAY_MS,
      withSpring(0, { damping: 22, stiffness: 210, mass: 1 })
    );
    logoScale.value = withDelay(
      LOGO_SPRING_DELAY_MS,
      withSpring(1, { damping: 20, stiffness: 200, mass: 1 })
    );

    sloganReveal.value = withDelay(
      520,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
    sloganY.value = withDelay(
      520,
      withSpring(0, { damping: 28, stiffness: 260, mass: 0.9 })
    );

    breath.value = withDelay(
      1100,
      withRepeat(
        withSequence(
          withTiming(1.008, {
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );

    const hideTimer = setTimeout(() => {
      rootOpacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          if (doneRef.current) return;
          doneRef.current = true;
          runOnJS(onDone)();
        }
      );
    }, SPLASH_HOLD_MS);

    return () => {
      clearTimeout(hideTimer);
      cancelAnimation(logoReveal);
      cancelAnimation(logoY);
      cancelAnimation(logoScale);
      cancelAnimation(sloganReveal);
      cancelAnimation(sloganY);
      cancelAnimation(breath);
      cancelAnimation(rootOpacity);
    };
  }, [
    breath,
    logoReveal,
    logoScale,
    logoY,
    onDone,
    rootOpacity,
    sloganReveal,
    sloganY,
  ]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoReveal.value,
    transform: [
      { translateY: logoY.value },
      { scale: logoScale.value * breath.value },
    ],
  }));

  const sloganAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sloganReveal.value,
    transform: [{ translateY: sloganY.value }],
  }));

  const hairlineStyle = useAnimatedStyle(() => ({
    opacity: sloganReveal.value * 0.85,
    transform: [{ scaleX: 0.12 + sloganReveal.value * 0.88 }],
  }));

  return (
    <Animated.View
      style={[styles.root, rootStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading NAYFT"
    >
      {isDark ? (
        <LinearGradient
          colors={['#080510', tokens.bg]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.45, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      ) : (
        <LinearGradient
          colors={[...lightGradientColors]}
          locations={[0, 0.52, 1]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.48, y: 0 }}
          end={{ x: 0.52, y: 1 }}
        />
      )}

      <View style={[styles.center, { paddingHorizontal: SPLASH_SIDE_GAP }]}>
        <Animated.View style={[styles.logoLift, logoAnimatedStyle, splashLogoElevation(isDark)]}>
          <Image
            source={logoSource}
            style={[
              { width: logoW, height: logoH },
              webLogoGlyphFilter(isDark),
            ]}
            contentFit="contain"
            accessibilityLabel="NAYFT logo"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sloganWrap,
            sloganAnimatedStyle,
            { maxWidth: Math.min(logoW + 48, LOGO_MAX_WIDTH + 80) },
          ]}
        >
          <Text
            style={[
              styles.sloganText,
              {
                color: isDark ? tokens.textMuted : tokens.colors.primary[900],
                fontFamily: tokens.typography.fontFamilies.sansSemiBold,
              },
            ]}
          >
            {SLOGAN}
          </Text>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.accentHairline,
              {
                backgroundColor: isDark
                  ? 'rgba(192, 132, 252, 0.45)'
                  : 'rgba(91, 33, 182, 0.45)',
              },
              hairlineStyle,
            ]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
  },
  logoLift: {
    alignItems: 'center',
  },
  sloganWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 14,
  },
  sloganText: {
    fontSize: Platform.OS === 'web' ? 17 : 15,
    letterSpacing: 0.12,
    lineHeight: Platform.OS === 'web' ? 26 : 23,
    textAlign: 'center',
    fontWeight: '500',
  },
  accentHairline: {
    alignSelf: 'center',
    width: 104,
    height: 2,
    borderRadius: 1,
  },
});
