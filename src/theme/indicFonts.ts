import type { SupportedLanguage } from '@/src/constants/languages';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoSansDevanagari_800ExtraBold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  NotoSansTamil_400Regular,
  NotoSansTamil_500Medium,
  NotoSansTamil_600SemiBold,
  NotoSansTamil_700Bold,
  NotoSansTamil_800ExtraBold,
} from '@expo-google-fonts/noto-sans-tamil';
import {
  NotoSansTelugu_400Regular,
  NotoSansTelugu_500Medium,
  NotoSansTelugu_600SemiBold,
  NotoSansTelugu_700Bold,
  NotoSansTelugu_800ExtraBold,
} from '@expo-google-fonts/noto-sans-telugu';
import {
  NotoSansKannada_400Regular,
  NotoSansKannada_500Medium,
  NotoSansKannada_600SemiBold,
  NotoSansKannada_700Bold,
  NotoSansKannada_800ExtraBold,
} from '@expo-google-fonts/noto-sans-kannada';
import {
  NotoSansMalayalam_400Regular,
  NotoSansMalayalam_500Medium,
  NotoSansMalayalam_600SemiBold,
  NotoSansMalayalam_700Bold,
  NotoSansMalayalam_800ExtraBold,
} from '@expo-google-fonts/noto-sans-malayalam';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
  NotoSansBengali_800ExtraBold,
} from '@expo-google-fonts/noto-sans-bengali';

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

const tamil: SansWeightMap = {
  regular: 'NotoSansTamil_400Regular',
  medium: 'NotoSansTamil_500Medium',
  semiBold: 'NotoSansTamil_600SemiBold',
  bold: 'NotoSansTamil_700Bold',
  extraBold: 'NotoSansTamil_800ExtraBold',
};

const telugu: SansWeightMap = {
  regular: 'NotoSansTelugu_400Regular',
  medium: 'NotoSansTelugu_500Medium',
  semiBold: 'NotoSansTelugu_600SemiBold',
  bold: 'NotoSansTelugu_700Bold',
  extraBold: 'NotoSansTelugu_800ExtraBold',
};

const kannada: SansWeightMap = {
  regular: 'NotoSansKannada_400Regular',
  medium: 'NotoSansKannada_500Medium',
  semiBold: 'NotoSansKannada_600SemiBold',
  bold: 'NotoSansKannada_700Bold',
  extraBold: 'NotoSansKannada_800ExtraBold',
};

const malayalam: SansWeightMap = {
  regular: 'NotoSansMalayalam_400Regular',
  medium: 'NotoSansMalayalam_500Medium',
  semiBold: 'NotoSansMalayalam_600SemiBold',
  bold: 'NotoSansMalayalam_700Bold',
  extraBold: 'NotoSansMalayalam_800ExtraBold',
};

const bengali: SansWeightMap = {
  regular: 'NotoSansBengali_400Regular',
  medium: 'NotoSansBengali_500Medium',
  semiBold: 'NotoSansBengali_600SemiBold',
  bold: 'NotoSansBengali_700Bold',
  extraBold: 'NotoSansBengali_800ExtraBold',
};

/** Maps UI language → Noto Sans script stack (Hindi & Marathi share Devanagari). */
export const NOTO_SANS_BY_LANGUAGE: Record<
  Exclude<SupportedLanguage, 'en'>,
  SansWeightMap
> = {
  hi: devanagari,
  mr: devanagari,
  ta: tamil,
  te: telugu,
  kn: kannada,
  ml: malayalam,
  bn: bengali,
};

/** Pass to `useFonts` so Indic glyphs render instead of tofu boxes with Manrope. */
export const indicFontAssets = {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoSansDevanagari_800ExtraBold,
  NotoSansTamil_400Regular,
  NotoSansTamil_500Medium,
  NotoSansTamil_600SemiBold,
  NotoSansTamil_700Bold,
  NotoSansTamil_800ExtraBold,
  NotoSansTelugu_400Regular,
  NotoSansTelugu_500Medium,
  NotoSansTelugu_600SemiBold,
  NotoSansTelugu_700Bold,
  NotoSansTelugu_800ExtraBold,
  NotoSansKannada_400Regular,
  NotoSansKannada_500Medium,
  NotoSansKannada_600SemiBold,
  NotoSansKannada_700Bold,
  NotoSansKannada_800ExtraBold,
  NotoSansMalayalam_400Regular,
  NotoSansMalayalam_500Medium,
  NotoSansMalayalam_600SemiBold,
  NotoSansMalayalam_700Bold,
  NotoSansMalayalam_800ExtraBold,
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
  NotoSansBengali_800ExtraBold,
};

export function sansWeightsForLanguage(
  lang: SupportedLanguage
): SansWeightMap | null {
  if (lang === 'en') return null;
  return NOTO_SANS_BY_LANGUAGE[lang];
}
