export const colors = {
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  success: {
    500: '#22c55e',
    600: '#16a34a',
  },
  danger: {
    500: '#ef4444',
    600: '#dc2626',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  surface: '#fff',
  white: '#fff',
  backdrop: 'rgba(0,0,0,0.45)',
};

export const darkColors = {
  primary: colors.primary,
  accent: colors.accent,
  success: colors.success,
  danger: colors.danger,
  neutral: {
    50: '#0a0a0a',
    100: '#171717',
    200: '#262626',
    300: '#404040',
    400: '#525252',
    500: '#737373',
    600: '#a3a3a3',
    700: '#d4d4d4',
    800: '#e5e5e5',
    900: '#f5f5f5',
    950: '#fafafa',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  card: 32,
  button: 24,
  fab: 28,
};

import { Platform } from 'react-native';

// Use boxShadow on web (shadow* is deprecated); shadow* on native
const shadowStyles = {
  sm: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.06)' } as const,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' } as const,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.15)' } as const,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};

export const shadows = {
  sm: shadowStyles.sm!,
  md: shadowStyles.md!,
  lg: shadowStyles.lg!,
};

export const semantic = {
  surface: colors.surface,
  backdrop: colors.backdrop,
  cardRadius: borderRadius.md,
  cardRadiusSmall: borderRadius.xs,
  sheetRadius: borderRadius.lg,
  cardShadow: shadows.sm,
  cardPadding: spacing.md,
  listMarginH: spacing.lg,
  listGap: spacing.sm,
};

export const typography = {
  fontSizes: {
    xs: 12,
    badge: 10,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32, // larger headers
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.1, // tighter lines
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const theme = {
  light: {
    colors,
    spacing,
    borderRadius,
    shadows,
    semantic,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing,
    borderRadius,
    shadows,
    semantic,
    typography,
  },
};

export type Theme = typeof theme.light;
