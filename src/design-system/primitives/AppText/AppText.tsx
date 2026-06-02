import React, { memo, useMemo } from 'react';
import {
  Text,
  type TextProps,
  type TextStyle,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type TextVariant =
  | 'display-xl'
  | 'heading-xl'
  | 'heading-l'
  | 'heading-m'
  | 'heading-s'
  | 'body-l'
  | 'body-m'
  | 'body-s'
  | 'caption'
  | 'eyebrow'
  | 'mono'
  | 'label';

export type AppTextColor =
  | 'default'
  | 'muted'
  | 'strong'
  | 'heading'
  | 'link'
  | 'danger'
  | 'label';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: AppTextColor;
};

function variantStyle(tokens: ThemeTokens, variant: TextVariant): TextStyle {
  const { fontSizes, fontWeights, letterSpacing, lineHeights, fontFamilies } =
    tokens.typography;
  const map: Record<TextVariant, TextStyle> = {
    'display-xl': {
      fontSize: fontSizes.xxxl,
      fontWeight: fontWeights.extrabold,
      letterSpacing: letterSpacing.display,
      lineHeight: fontSizes.xxxl * lineHeights.display,
      fontFamily: fontFamilies.sansExtraBold,
    },
    'heading-xl': {
      fontSize: fontSizes.xxl,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacing.section,
      lineHeight: fontSizes.xxl * lineHeights.heading,
      fontFamily: fontFamilies.sansBold,
    },
    'heading-l': {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacing.subheading,
      lineHeight: fontSizes.xl * lineHeights.heading,
      fontFamily: fontFamilies.sansBold,
    },
    'heading-m': {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacing.card,
      lineHeight: fontSizes.lg * lineHeights.heading,
      fontFamily: fontFamilies.sansSemiBold,
    },
    'heading-s': {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacing.normal,
      lineHeight: fontSizes.md * lineHeights.heading,
      fontFamily: fontFamilies.sansSemiBold,
    },
    'body-l': {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.md * lineHeights.body,
      fontFamily: fontFamilies.sans,
    },
    'body-m': {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.base * lineHeights.body,
      fontFamily: fontFamilies.sans,
    },
    'body-s': {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.sm * lineHeights.body,
      fontFamily: fontFamilies.sans,
    },
    caption: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacing.caption,
      lineHeight: fontSizes.xs * lineHeights.normal,
      fontFamily: fontFamilies.sansMedium,
    },
    eyebrow: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacing.eyebrow,
      textTransform: 'uppercase',
      fontFamily: fontFamilies.sansSemiBold,
    },
    mono: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      fontFamily: fontFamilies.mono,
    },
    label: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      fontFamily: fontFamilies.sansSemiBold,
    },
  };
  return map[variant];
}

function colorStyle(tokens: ThemeTokens, color: AppTextColor): TextStyle {
  const map: Record<AppTextColor, string> = {
    default: tokens.text,
    muted: tokens.textMuted,
    strong: tokens.textStrong,
    heading: tokens.heading,
    link: tokens.link,
    danger: tokens.colors.danger[500],
    label: tokens.label,
  };
  return { color: map[color] };
}

function AppTextComponent({
  variant = 'body-m',
  color = 'default',
  style,
  ...rest
}: AppTextProps) {
  const { tokens } = useAppTheme();
  const combined = useMemo(
    () => [variantStyle(tokens, variant), colorStyle(tokens, color), style],
    [tokens, variant, color, style]
  );
  return <Text style={combined} {...rest} />;
}

export const AppText = memo(AppTextComponent);
