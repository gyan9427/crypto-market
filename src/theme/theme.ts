import { Platform } from 'react-native';

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
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  card: 32,
  button: 24,
  fab: 28,
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
  text: string;
  textMuted: string;
  textStrong: string;
  border: string;
  borderSubtle: string;
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
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
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
      web: shadowWeb('0 20px 50px rgba(0, 0, 0, 0.35)'),
      default: shadowNative(1, 50, 12, 20, 0.35),
    }) as ShadowStyle;
    const cardHover = Platform.select({
      web: shadowWeb('0 24px 56px rgba(0, 0, 0, 0.42)'),
      default: shadowNative(1, 56, 16, 24, 0.4),
    }) as ShadowStyle;
    const dropdown = Platform.select({
      web: shadowWeb('0 18px 40px rgba(0, 0, 0, 0.45)'),
      default: shadowNative(1, 40, 16, 18, 0.45),
    }) as ShadowStyle;
    const sm = Platform.select({
      web: shadowWeb('0 12px 40px rgba(0, 0, 0, 0.35)'),
      default: shadowNative(1, 40, 8, 12, 0.35),
    }) as ShadowStyle;
    const md = Platform.select({
      web: shadowWeb('0 12px 40px rgba(0, 0, 0, 0.35)'),
      default: shadowNative(1, 40, 10, 12, 0.35),
    }) as ShadowStyle;
    const lg = Platform.select({
      web: shadowWeb('0 18px 48px rgba(0, 0, 0, 0.4)'),
      default: shadowNative(1, 48, 12, 18, 0.4),
    }) as ShadowStyle;
    return { sm, md, lg, card, cardHover, dropdown };
  }
  const card = Platform.select({
    web: shadowWeb('0 8px 28px rgba(0, 0, 0, 0.06)'),
    default: shadowNative(1, 28, 4, 8, 0.06),
  }) as ShadowStyle;
  const cardHover = Platform.select({
    web: shadowWeb('0 20px 50px rgba(0, 0, 0, 0.1)'),
    default: shadowNative(1, 50, 8, 20, 0.1),
  }) as ShadowStyle;
  const dropdown = Platform.select({
    web: shadowWeb('0 18px 40px rgba(0, 0, 0, 0.12)'),
    default: shadowNative(1, 40, 8, 18, 0.12),
  }) as ShadowStyle;
  const sm = Platform.select({
    web: shadowWeb('0 4px 20px rgba(0, 0, 0, 0.06)'),
    default: shadowNative(1, 20, 3, 4, 0.06),
  }) as ShadowStyle;
  const md = Platform.select({
    web: shadowWeb('0 4px 6px rgba(0, 0, 0, 0.08)'),
    default: shadowNative(1, 6, 4, 4, 0.08),
  }) as ShadowStyle;
  const lg = Platform.select({
    web: shadowWeb('0 8px 16px rgba(0, 0, 0, 0.1)'),
    default: shadowNative(1, 16, 6, 8, 0.1),
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
      text: darkColors.neutral[900],
      textMuted: darkColors.neutral[600],
      textStrong: '#ffffff',
      border: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
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
        cardRadius: borderRadius.md,
        cardRadiusSmall: borderRadius.xs,
        sheetRadius: borderRadius.lg,
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
    text: colors.neutral[900],
    textMuted: colors.neutral[600],
    textStrong: colors.neutral[950],
    border: 'rgba(0, 0, 0, 0.08)',
    borderSubtle: colors.neutral[200],
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
      cardRadius: borderRadius.md,
      cardRadiusSmall: borderRadius.xs,
      sheetRadius: borderRadius.lg,
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
  cardRadius: borderRadius.md,
  cardRadiusSmall: borderRadius.xs,
  sheetRadius: borderRadius.lg,
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
