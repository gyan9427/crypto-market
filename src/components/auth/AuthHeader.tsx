import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { AuthPalette } from '@/src/components/auth/authPalette';

const LOGO_LIGHT = require('../../../assets/images/logo.png');
const LOGO_DARK = require('../../../assets/images/logo_dark.png');

type Props = {
  palette: AuthPalette;
  isDark: boolean;
  title?: string;
  subtitle?: string;
};

export function AuthHeader({
  palette,
  isDark,
  title,
  subtitle,
}: Props) {
  const logoSource = isDark ? LOGO_LIGHT : LOGO_DARK;
  const { width: screenW } = useWindowDimensions();
  const logoW = Math.min(screenW - 64, 480);
  const logoH = Math.min(Math.round(logoW * 0.36), 180);

  return (
    <Animated.View
      entering={FadeInDown.delay(20).springify().damping(26).stiffness(220)}
      style={styles.wrap}
    >
      <Image
        source={logoSource}
        style={[styles.logo, { width: logoW, height: logoH }]}
        contentFit="contain"
        accessibilityLabel="NAYFT"
      />
      {title ? <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text> : null}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logo: {
    marginBottom: 24,
    maxHeight: 180,
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    letterSpacing: 0.1,
    maxWidth: 340,
  },
});
