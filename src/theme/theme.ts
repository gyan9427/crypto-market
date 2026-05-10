import { Platform } from 'react-native';
import type { SupportedLanguage } from '@/src/constants/languages';
import type { SansWeightMap } from '@/src/theme/indicFonts';

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

/** Inverted neutrals for dark surfaces (legacy; prefer ThemeTokens) */
export const darkColors = {
  primary: colors.primary,
  accent: colors.accent,
  success: colors.success,
  danger: colors.danger,
  error: colors.error,
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
  surface: '#121212',
  white: '#ffffff',
  backdrop: 'rgba(0,0,0,0.65)',
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
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  card: 12,
  button: 8,
  sheet: 24,
  fab: 24,
  pill: 999,
};

export const motion = {
  easeOut: [0.22, 1, 0.36, 1] as const,
};

type ShadowStyle = Record<string, unknown>;

function shadowNative(
  opacity: number,
  radius: number,
  elevation: number,
  offsetY: number,
  shadowOpacity: number
): ShadowStyle {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity,
    shadowRadius: radius,
    elevation,
  };
}

function shadowWeb(boxShadow: string): ShadowStyle {
  return { boxShadow } as ShadowStyle;
}

/** Legacy shadows (theme-agnostic); prefer tokens.shadows */
export const shadows = {
  sm: Platform.select({
    web: shadowWeb('0px 2px 4px rgba(0,0,0,0.06)'),
    default: shadowNative(1, 4, 2, 2, 0.06),
  }) as ShadowStyle,
  md: Platform.select({
    web: shadowWeb('0px 4px 6px rgba(0,0,0,0.1)'),
    default: shadowNative(1, 6, 4, 4, 0.1),
  }) as ShadowStyle,
  lg: Platform.select({
    web: shadowWeb('0px 8px 16px rgba(0,0,0,0.15)'),
    default: shadowNative(1, 16, 8, 8, 0.15),
  }) as ShadowStyle,
};

export type AppPalette = typeof colors;

export type ThemeTokens = {
  isDark: boolean;
  colors: AppPalette;
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textStrong: string;
  heading: string;
  label: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  link: string;
  linkHover: string;
  tabBarBg: string;
  tabBarBorder: string;
  headerBg: string;
  headerBorder: string;
  inputBg: string;
  inputBorder: string;
  backdrop: string;
  shadows: {
    sm: ShadowStyle;
    md: ShadowStyle;
    lg: ShadowStyle;
    card: ShadowStyle;
    cardHover: ShadowStyle;
    dropdown: ShadowStyle;
  };
  semantic: {
    surface: string;
    backdrop: string;
    cardRadius: number;
    cardRadiusSmall: number;
    sheetRadius: number;
    cardShadow: ShadowStyle;
    cardPadding: number;
    listMarginH: number;
    listGap: number;
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
};

const fontFallbackSans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'system-ui',
}) as string;

const fontFallbackMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, monospace',
}) as string;

/** Populated after fonts load; use with ThemeProvider */
export const typography = {
  fontFamilies: {
    sans: fontFallbackSans,
    sansMedium: fontFallbackSans,
    sansSemiBold: fontFallbackSans,
    sansBold: fontFallbackSans,
    sansExtraBold: fontFallbackSans,
    mono: fontFallbackMono,
    monoMedium: fontFallbackMono,
  },
  fontSizes: {
    xs: 12,
    badge: 10,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  letterSpacing: {
    display: -0.96,
    large: -0.8,
    section: -0.64,
    card: -0.48,
    subheading: -0.4,
    caption: -0.24,
    eyebrow: 0.12,
    button: 0.02,
    normal: 0,
  },
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
    body: 1.6,
  },
};

function buildShadows(isDark: boolean): ThemeTokens['shadows'] {
  if (isDark) {
    const card = Platform.select({
      web: shadowWeb('0 12px 40px rgba(0,0,0,0.35)'),
      default: shadowNative(1, 40, 12, 12, 0.35),
    }) as ShadowStyle;
    const cardHover = Platform.select({
      web: shadowWeb('0 16px 48px rgba(0,0,0,0.42)'),
      default: shadowNative(1, 48, 16, 16, 0.42),
    }) as ShadowStyle;
    const dropdown = Platform.select({
      web: shadowWeb('0 24px 64px rgba(0,0,0,0.50)'),
      default: shadowNative(1, 64, 16, 24, 0.5),
    }) as ShadowStyle;
    const sm = Platform.select({
      web: shadowWeb('0 2px 8px rgba(0,0,0,0.25)'),
      default: shadowNative(1, 8, 4, 2, 0.25),
    }) as ShadowStyle;
    const md = Platform.select({
      web: shadowWeb('0 12px 40px rgba(0,0,0,0.35)'),
      default: shadowNative(1, 40, 10, 12, 0.35),
    }) as ShadowStyle;
    const lg = Platform.select({
      web: shadowWeb('0 16px 48px rgba(0,0,0,0.42)'),
      default: shadowNative(1, 48, 12, 16, 0.42),
    }) as ShadowStyle;
    return { sm, md, lg, card, cardHover, dropdown };
  }
  // Light mode: chromatic purple-tinted shadows per NAYFT design system
  const card = Platform.select({
    web: shadowWeb('0 4px 20px rgba(88,28,135,0.08), 0 1px 3px rgba(0,0,0,0.04)'),
    default: shadowNative(1, 20, 4, 4, 0.08),
  }) as ShadowStyle;
  const cardHover = Platform.select({
    web: shadowWeb('0 8px 32px rgba(88,28,135,0.12), 0 2px 6px rgba(0,0,0,0.06)'),
    default: shadowNative(1, 32, 8, 8, 0.12),
  }) as ShadowStyle;
  const dropdown = Platform.select({
    web: shadowWeb('0 16px 48px rgba(88,28,135,0.18), 0 4px 12px rgba(0,0,0,0.08)'),
    default: shadowNative(1, 48, 8, 16, 0.18),
  }) as ShadowStyle;
  const sm = Platform.select({
    web: shadowWeb('0 1px 3px rgba(0,0,0,0.04)'),
    default: shadowNative(1, 3, 2, 1, 0.04),
  }) as ShadowStyle;
  const md = Platform.select({
    web: shadowWeb('0 4px 20px rgba(88,28,135,0.08), 0 1px 3px rgba(0,0,0,0.04)'),
    default: shadowNative(1, 20, 4, 4, 0.08),
  }) as ShadowStyle;
  const lg = Platform.select({
    web: shadowWeb('0 8px 32px rgba(88,28,135,0.12), 0 2px 6px rgba(0,0,0,0.06)'),
    default: shadowNative(1, 32, 6, 8, 0.12),
  }) as ShadowStyle;
  return { sm, md, lg, card, cardHover, dropdown };
}

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

  if (isDark) {
    // Inverted neutral scale: low indices are dark surfaces; high indices are light foregrounds.
    return {
      isDark: true,
      colors: palette,
      bg: '#0a0a0a',
      bgElevated: '#121212',
      surface: '#121212',
      surfaceMuted: '#171717',
      text: '#f5f5f5',
      textMuted: '#a3a3a3',
      textStrong: '#ffffff',
      heading: '#fafafa',
      label: '#d8b4fe',
      border: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
      borderStrong: 'rgba(255, 255, 255, 0.12)',
      link: colors.primary[400],
      linkHover: colors.accent[400],
      tabBarBg: 'rgba(10, 10, 10, 0.96)',
      tabBarBorder: 'rgba(255, 255, 255, 0.06)',
      headerBg: 'rgba(10, 10, 10, 0.72)',
      headerBorder: 'rgba(255, 255, 255, 0.06)',
      inputBg: darkColors.neutral[100],
      inputBorder: darkColors.neutral[300],
      backdrop: darkColors.backdrop,
      shadows: shadowsResolved,
      semantic: {
        surface: '#121212',
        backdrop: darkColors.backdrop,
        cardRadius: borderRadius.lg,
        cardRadiusSmall: borderRadius.md,
        sheetRadius: borderRadius.sheet,
        cardShadow: shadowsResolved.card,
        cardPadding: spacing.md,
        listMarginH: spacing.lg,
        listGap: spacing.sm,
      },
      spacing,
      borderRadius,
      typography,
    };
  }

  return {
    isDark: false,
    colors: palette,
    bg: '#f4f4f5',
    bgElevated: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: '#fafafa',
    text: '#171717',
    textMuted: '#525252',
    textStrong: '#0a0a0a',
    heading: '#1a0a2e',
    label: '#3d2059',
    border: '#e5e5e5',
    borderSubtle: '#f5f5f5',
    borderStrong: '#d4d4d4',
    link: colors.primary[600],
    linkHover: colors.accent[600],
    tabBarBg: 'rgba(255, 255, 255, 0.98)',
    tabBarBorder: colors.neutral[200],
    headerBg: 'rgba(255, 255, 255, 0.88)',
    headerBorder: 'rgba(0, 0, 0, 0.08)',
    inputBg: colors.neutral[50],
    inputBorder: colors.neutral[200],
    backdrop: colors.backdrop,
    shadows: shadowsResolved,
    semantic: {
      surface: colors.surface,
      backdrop: colors.backdrop,
      cardRadius: borderRadius.lg,
      cardRadiusSmall: borderRadius.md,
      sheetRadius: borderRadius.sheet,
      cardShadow: shadowsResolved.card,
      cardPadding: spacing.md,
      listMarginH: spacing.lg,
      listGap: spacing.sm,
    },
    spacing,
    borderRadius,
    typography,
  };
}

/** @deprecated use getThemeTokens + ThemeProvider */
export const semantic = {
  surface: colors.surface,
  backdrop: colors.backdrop,
  cardRadius: borderRadius.lg,
  cardRadiusSmall: borderRadius.md,
  sheetRadius: borderRadius.sheet,
  cardShadow: shadows.sm,
  cardPadding: spacing.md,
  listMarginH: spacing.lg,
  listGap: spacing.sm,
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

export function typographyWithFonts(
  base: typeof typography,
  loaded: {
    manrope?: Record<string, string>;
    jetbrains?: Record<string, string>;
  }
): typeof typography {
  const m = loaded.manrope;
  const j = loaded.jetbrains;
  return {
    ...base,
    fontFamilies: {
      sans: m?.regular ?? base.fontFamilies.sans,
      sansMedium: m?.medium ?? base.fontFamilies.sansMedium,
      sansSemiBold: m?.semiBold ?? base.fontFamilies.sansSemiBold,
      sansBold: m?.bold ?? base.fontFamilies.sansBold,
      sansExtraBold: m?.extraBold ?? base.fontFamilies.sansExtraBold,
      mono: j?.regular ?? base.fontFamilies.mono,
      monoMedium: j?.medium ?? base.fontFamilies.monoMedium,
    },
  };
}

/** Use Noto Sans for Indic UI languages so glyphs render; otherwise Manrope. */
export function typographyWithFontsForUiLanguage(
  base: typeof typography,
  language: SupportedLanguage,
  manrope: NonNullable<Parameters<typeof typographyWithFonts>[1]>['manrope'],
  jetbrains: NonNullable<Parameters<typeof typographyWithFonts>[1]>['jetbrains'],
  notoSans: SansWeightMap | null
): typeof typography {
  if (notoSans) {
    const j = jetbrains;
    return {
      ...base,
      fontFamilies: {
        sans: notoSans.regular,
        sansMedium: notoSans.medium,
        sansSemiBold: notoSans.semiBold,
        sansBold: notoSans.bold,
        sansExtraBold: notoSans.extraBold,
        mono: j?.regular ?? base.fontFamilies.mono,
        monoMedium: j?.medium ?? base.fontFamilies.monoMedium,
      },
    };
  }
  return typographyWithFonts(base, { manrope, jetbrains });
}
