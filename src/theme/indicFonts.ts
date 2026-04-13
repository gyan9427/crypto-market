import type { SupportedLanguage } from '@/src/constants/languages';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoSansDevanagari_800ExtraBold,
} from '@expo-google-fonts/noto-sans-devanagari';

/** Weights aligned with Manrope usage in `typographyWithFonts`. */
export type SansWeightMap = {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  extraBold: string;
};

const devanagari: SansWeightMap = {
  regular: 'NotoSansDevanagari_400Regular',
  medium: 'NotoSansDevanagari_500Medium',
  semiBold: 'NotoSansDevanagari_600SemiBold',
  bold: 'NotoSansDevanagari_700Bold',
  extraBold: 'NotoSansDevanagari_800ExtraBold',
};

/** Maps UI language → Noto Sans script stack. */
export const NOTO_SANS_BY_LANGUAGE: Record<
  Exclude<SupportedLanguage, 'en'>,
  SansWeightMap
> = {
  hi: devanagari,
};

/** Pass to `useFonts` so Indic glyphs render instead of tofu boxes with Manrope. */
export const indicFontAssets = {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoSansDevanagari_800ExtraBold,
};

export function sansWeightsForLanguage(
  lang: SupportedLanguage
): SansWeightMap | null {
  if (lang === 'en') return null;
  return NOTO_SANS_BY_LANGUAGE[lang];
}
