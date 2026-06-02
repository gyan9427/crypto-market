import { Platform } from 'react-native';
import type { SupportedLanguage } from '@/src/constants/languages';
import type { SansWeightMap } from '@/src/theme/indicFonts';

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
    tabLabel: 0.08,
  },
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
    body: 1.6,
    heading: 1.35,
    display: 1.2,
  },
};

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
