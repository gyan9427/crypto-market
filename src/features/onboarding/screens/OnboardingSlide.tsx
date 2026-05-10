import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AnimatedIllustration } from '../components/AnimatedIllustration';

export interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: React.ReactNode;
}

function OnboardingSlideInner({ title, description, illustration }: OnboardingSlideProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildOnboardingSlideStyles(tokens), [tokens]);

  return (
    <View style={styles.column}>
      <AnimatedIllustration>{illustration}</AnimatedIllustration>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  );
}

function buildOnboardingSlideStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    column: {
      flex: 1,
      paddingHorizontal: s.lg,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: typo.fontSizes.xxxl,
      fontWeight: '400',
      textAlign: 'center',
      marginBottom: s.md,
      lineHeight: typo.fontSizes.xxxl * 1.12,
      letterSpacing: -0.64,
      color: tokens.textStrong,
      fontFamily: typo.fontFamilies.sans,
    },
    desc: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.regular,
      textAlign: 'center',
      lineHeight: typo.fontSizes.md * 1.6,
      maxWidth: 320,
      color: tokens.textMuted,
      fontFamily: typo.fontFamilies.sans,
    },
  });
}

export const OnboardingSlide = memo(OnboardingSlideInner);
