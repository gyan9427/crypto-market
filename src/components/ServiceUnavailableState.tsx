import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated as RNAnimated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors, spacing, borderRadius, typography, shadows } from '@/src/theme/theme';

type FloatingCoinProps = {
  size: number;
  gradientId: string;
  stopColor: string;
  stopColorEnd: string;
  symbol: string;
  symbolColor: string;
  style: RNAnimated.WithAnimatedObject<ViewStyle>;
};

const FloatingCoin = memo(function FloatingCoin({
  size,
  gradientId,
  stopColor,
  stopColorEnd,
  symbol,
  symbolColor,
  style,
}: FloatingCoinProps) {
  const r = size / 2;
  return (
    <RNAnimated.View style={[styles.coinWrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={stopColor} />
            <Stop offset="100%" stopColor={stopColorEnd} />
          </LinearGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r - 1.5} fill={`url(#${gradientId})`} />
        <Circle cx={r} cy={r} r={r - 1.5} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
      </Svg>
      <View style={[styles.coinLabel, { width: size, height: size }]}>
        <Text style={[styles.coinSymbol, { fontSize: size * 0.38, color: symbolColor }]}>{symbol}</Text>
      </View>
    </RNAnimated.View>
  );
});

const HubGraphic = memo(function HubGraphic({ pulse }: { pulse: RNAnimated.Value }) {
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });

  return (
    <RNAnimated.View style={{ opacity, transform: [{ scale }] }}>
      <Svg width={112} height={112} viewBox="0 0 112 112">
        <Defs>
          <LinearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.neutral[200]} />
            <Stop offset="100%" stopColor={colors.neutral[300]} />
          </LinearGradient>
        </Defs>
        <Circle cx={56} cy={56} r={40} fill="url(#hubGrad)" />
        <Circle cx={56} cy={56} r={40} fill="none" stroke={colors.neutral[400]} strokeWidth={1.5} strokeDasharray="6 8" />
        <Path
          d="M56 28 L56 44 M56 68 L56 84 M28 56 L44 56 M68 56 L84 56"
          stroke={colors.neutral[500]}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Circle cx={56} cy={56} r={8} fill={colors.primary[400]} />
      </Svg>
    </RNAnimated.View>
  );
});

const WaveLines = memo(function WaveLines({ shift }: { shift: RNAnimated.Value }) {
  const t = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  return (
    <RNAnimated.View style={[styles.waveLines, { transform: [{ translateX: t }] }]}>
      <Svg width={140} height={48} viewBox="0 0 140 48">
        <Path
          d="M0 24 Q 20 8, 40 24 T 80 24 T 120 24"
          fill="none"
          stroke={colors.primary[200]}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
        <Path
          d="M0 32 Q 22 40, 44 32 T 88 32 T 132 32"
          fill="none"
          stroke={colors.accent[200]}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.7}
        />
      </Svg>
    </RNAnimated.View>
  );
});

export type ServiceUnavailableStateProps = {
  onRetry: () => void;
  title?: string;
  message?: string;
  retryLabel?: string;
};

function ServiceUnavailableStateInner({
  onRetry,
  title = "We're offline for a moment",
  message = 'Our servers are taking a short break. Your markets and news will sync again soon.',
  retryLabel = 'Try again',
}: ServiceUnavailableStateProps) {
  const drift = useRef(new RNAnimated.Value(0)).current;
  const driftB = useRef(new RNAnimated.Value(0)).current;
  const driftC = useRef(new RNAnimated.Value(0)).current;
  const hubPulse = useRef(new RNAnimated.Value(0)).current;
  const wave = useRef(new RNAnimated.Value(0)).current;
  const svgFloat = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const loop = (v: RNAnimated.Value, duration: number, delay = 0) =>
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.delay(delay),
          RNAnimated.timing(v, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          RNAnimated.timing(v, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const a = loop(drift, 2200, 0);
    const b = loop(driftB, 2600, 400);
    const c = loop(driftC, 2400, 800);
    const hub = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(hubPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(hubPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const w = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(wave, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        RNAnimated.timing(wave, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    const scene = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(svgFloat, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(svgFloat, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    a.start();
    b.start();
    c.start();
    hub.start();
    w.start();
    scene.start();

    return () => {
      a.stop();
      b.stop();
      c.stop();
      hub.stop();
      w.stop();
      scene.stop();
    };
  }, [drift, driftB, driftC, hubPulse, wave, svgFloat]);

  const coinA = useMemo(
    () => ({
      transform: [
        {
          translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 8] }),
        },
        {
          translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-4, 6] }),
        },
        {
          rotate: drift.interpolate({
            inputRange: [0, 1],
            outputRange: ['-6deg', '4deg'],
          }),
        },
      ],
    }),
    [drift]
  );

  const coinB = useMemo(
    () => ({
      transform: [
        {
          translateY: driftB.interpolate({ inputRange: [0, 1], outputRange: [6, -12] }),
        },
        {
          translateX: driftB.interpolate({ inputRange: [0, 1], outputRange: [5, -8] }),
        },
        {
          rotate: driftB.interpolate({
            inputRange: [0, 1],
            outputRange: ['5deg', '-7deg'],
          }),
        },
      ],
    }),
    [driftB]
  );

  const coinC = useMemo(
    () => ({
      transform: [
        {
          translateY: driftC.interpolate({ inputRange: [0, 1], outputRange: [-6, 10] }),
        },
        {
          translateX: driftC.interpolate({ inputRange: [0, 1], outputRange: [-8, 4] }),
        },
        {
          scale: driftC.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }),
        },
      ],
    }),
    [driftC]
  );

  const sceneStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: svgFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
        },
      ],
    }),
    [svgFloat]
  );

  return (
    <View style={styles.root} accessibilityRole="none">
      <RNAnimated.View style={[styles.illustration, sceneStyle]}>
        <View style={styles.aura}>
          <Svg width={280} height={200} viewBox="0 0 280 200" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="auraA" x1="50%" y1="0%" x2="50%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary[100]} stopOpacity={0.9} />
                <Stop offset="100%" stopColor={colors.primary[50]} stopOpacity={0.2} />
              </LinearGradient>
            </Defs>
            <Circle cx={140} cy={100} r={88} fill="url(#auraA)" />
          </Svg>
        </View>

        <View style={styles.coinRow}>
          <View style={styles.coinLeft}>
            <FloatingCoin
              size={56}
              gradientId="btcGrad"
              stopColor="#F7931A"
              stopColorEnd="#E2761B"
              symbol="₿"
              symbolColor="rgba(255,255,255,0.95)"
              style={coinA}
            />
          </View>
          <View style={styles.hubCenter}>
            <HubGraphic pulse={hubPulse} />
            <View style={styles.waveSlot}>
              <WaveLines shift={wave} />
            </View>
          </View>
          <View style={styles.coinRight}>
            <FloatingCoin
              size={52}
              gradientId="ethGrad"
              stopColor={colors.primary[400]}
              stopColorEnd={colors.primary[600]}
              symbol="Ξ"
              symbolColor="rgba(255,255,255,0.95)"
              style={coinB}
            />
          </View>
        </View>

        <View style={styles.bottomCoin}>
          <FloatingCoin
            size={48}
            gradientId="altGrad"
            stopColor={colors.accent[300]}
            stopColorEnd={colors.accent[500]}
            symbol="◈"
            symbolColor="rgba(255,255,255,0.95)"
            style={coinC}
          />
        </View>

        <View style={styles.captionHint} pointerEvents="none">
          <Svg width={200} height={24} viewBox="0 0 200 24">
            <Line
              x1={24}
              y1={12}
              x2={176}
              y2={12}
              stroke={colors.neutral[200]}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          </Svg>
        </View>
      </RNAnimated.View>

      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={styles.retryLabel}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  illustration: {
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  aura: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  coinLeft: {
    marginRight: -8,
    zIndex: 2,
  },
  coinRight: {
    marginLeft: -8,
    zIndex: 2,
  },
  hubCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  waveSlot: {
    position: 'absolute',
    bottom: -6,
    opacity: 0.9,
  },
  bottomCoin: {
    marginTop: spacing.md,
    zIndex: 2,
  },
  waveLines: {
    opacity: 0.95,
  },
  captionHint: {
    marginTop: spacing.sm,
    opacity: 0.6,
  },
  coinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinLabel: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinSymbol: {
    fontWeight: typography.fontWeights.bold,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      default: {},
    }),
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: typography.fontSizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.button,
    ...shadows.md,
  },
  retryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  retryLabel: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
});

export const ServiceUnavailableState = memo(ServiceUnavailableStateInner);
