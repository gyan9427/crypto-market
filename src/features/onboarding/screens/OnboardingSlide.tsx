import React, { memo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { colors, darkColors, spacing, typography } from '@/src/theme/theme';
import { AnimatedIllustration } from '../components/AnimatedIllustration';

export interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: React.ReactNode;
}

function OnboardingSlideInner({ title, description, illustration }: OnboardingSlideProps) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const textPrimary = dark ? darkColors.neutral[900] : colors.neutral[900];
  const textMuted = dark ? darkColors.neutral[500] : colors.neutral[600];

  return (
    <View style={styles.column}>
      <AnimatedIllustration>{illustration}</AnimatedIllustration>
      <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
      <Text style={[styles.desc, { color: textMuted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.fontSizes.xxxl * typography.lineHeights.tight,
  },
  desc: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * typography.lineHeights.relaxed,
    maxWidth: 340,
  },
});

export const OnboardingSlide = memo(OnboardingSlideInner);
