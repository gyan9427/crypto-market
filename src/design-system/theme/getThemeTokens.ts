import { colors, darkColors, type AppPalette } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { borderRadius } from '../tokens/radii';
import { typography } from '../tokens/typography';
import { buildShadows } from '../tokens/shadows';
import { motion, motionDuration, motionEasing } from '../tokens/motion';
import { zIndex } from '../tokens/zIndex';
import { opacity } from '../tokens/opacity';
import { getGradientTokens } from '../tokens/gradients';
import { getChartColorTokens } from '../tokens/charts';
import type { ThemeTokens } from './types';

export function getThemeTokens(isDark: boolean): ThemeTokens {
  const palette: AppPalette = isDark
    ? {
        ...colors,
        neutral: darkColors.neutral,
        surface: darkColors.surface,
        backdrop: darkColors.backdrop,
      }
    : colors;

  const shadowsResolved = buildShadows(isDark);

  const semantic = {
    surface: isDark ? colors.ink2 : colors.surface,
    backdrop: isDark ? darkColors.backdrop : colors.backdrop,
    cardRadius: borderRadius.card,
    cardRadiusSmall: borderRadius.sm,
    sheetRadius: borderRadius.sheet,
    cardShadow: shadowsResolved.card,
    cardPadding: spacing.md,
    listMarginH: spacing.lg,
    listGap: spacing.sm,
  };

  const motionTokens = {
    duration: motionDuration,
    easing: motionEasing,
    easeOut: motion.easeOut,
  };

  const partial = isDark
    ? {
        isDark: true as const,
        colors: palette,
        bg: colors.ink,
        bgElevated: colors.ink2,
        surface: colors.ink2,
        surfaceMuted: colors.ink3,
        text: 'rgba(255, 255, 255, 0.92)',
        textMuted: 'rgba(255, 255, 255, 0.55)',
        textStrong: '#ffffff',
        heading: '#ffffff',
        label: colors.primary[300],
        border: 'rgba(255, 255, 255, 0.08)',
        borderSubtle: 'rgba(255, 255, 255, 0.06)',
        borderStrong: 'rgba(255, 255, 255, 0.12)',
        borderFocus: 'rgba(168, 85, 247, 0.5)',
        link: colors.primary[400],
        linkHover: colors.primary[300],
        tabBarBg: 'rgba(10, 10, 15, 0.96)',
        tabBarBorder: 'rgba(255, 255, 255, 0.06)',
        tabBarHeight: 68,
        headerBg: 'rgba(10, 10, 10, 0.72)',
        headerBorder: 'rgba(255, 255, 255, 0.06)',
        inputBg: darkColors.neutral[100],
        inputBorder: darkColors.neutral[300],
        backdrop: darkColors.backdrop,
      }
    : {
        isDark: false as const,
        colors: palette,
        bg: colors.pageSurface,
        bgElevated: colors.surface,
        surface: colors.surface,
        surfaceMuted: colors.pageSurfaceAlt,
        text: colors.ink,
        textMuted: colors.muted,
        textStrong: colors.ink,
        heading: colors.ink,
        label: colors.muted,
        border: 'rgba(10, 10, 15, 0.10)',
        borderSubtle: 'rgba(10, 10, 15, 0.06)',
        borderStrong: 'rgba(10, 10, 15, 0.18)',
        borderFocus: colors.primary[500],
        link: colors.primary[600],
        linkHover: colors.primary[500],
        tabBarBg: 'rgba(255, 255, 255, 0.98)',
        tabBarBorder: 'rgba(10, 10, 15, 0.10)',
        tabBarHeight: 68,
        headerBg: 'rgba(255, 255, 255, 0.88)',
        headerBorder: 'rgba(0, 0, 0, 0.08)',
        inputBg: colors.neutral[50],
        inputBorder: colors.neutral[200],
        backdrop: colors.backdrop,
      };

  const tokens = {
    ...partial,
    shadows: shadowsResolved,
    semantic,
    spacing,
    borderRadius,
    typography,
    motion: motionTokens,
    zIndex,
    opacity,
    gradients: getGradientTokens({
      ...partial,
      shadows: shadowsResolved,
      semantic,
      spacing,
      borderRadius,
      typography,
      motion: motionTokens,
      zIndex,
      opacity,
      gradients: {} as ThemeTokens['gradients'],
      chart: {} as ThemeTokens['chart'],
    }),
    chart: getChartColorTokens({
      ...partial,
      shadows: shadowsResolved,
      semantic,
      spacing,
      borderRadius,
      typography,
      motion: motionTokens,
      zIndex,
      opacity,
      gradients: {} as ThemeTokens['gradients'],
      chart: {} as ThemeTokens['chart'],
    }),
  } satisfies ThemeTokens;

  return tokens;
}
