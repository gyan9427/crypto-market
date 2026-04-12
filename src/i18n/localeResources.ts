/**
 * Locale JSON registry + English fallback.
 *
 * Metro/React Native cannot discover new files on disk at runtime; each locale file must be
 * imported here once. To add a language:
 * 1. Add `src/i18n/locales/<code>.json` (copy structure from `en.json`).
 * 2. Add `import <code> from './locales/<code>.json'` below.
 * 3. Add one entry to `LOCALE_BUNDLES`.
 *
 * Any `SupportedLanguage` not listed in `LOCALE_BUNDLES` uses `en` as the translation object.
 */
import type { SupportedLanguage } from '@/src/constants/languages';
import { SUPPORTED_LANGUAGES } from '@/src/constants/languages';
import en from '@/src/i18n/locales/en.json';
import hi from '@/src/i18n/locales/hi.json';
import ta from '@/src/i18n/locales/ta.json';

export type TranslationResource = typeof en;

/** Partial locale files are merged at runtime with i18n `fallbackLng: 'en'` for missing keys. */
const LOCALE_BUNDLES: Partial<Record<SupportedLanguage, TranslationResource>> = {
  hi: hi as TranslationResource,
  ta: ta as TranslationResource,
};

export function translationFor(lang: SupportedLanguage): TranslationResource {
  if (lang === 'en') return en;
  const bundle = LOCALE_BUNDLES[lang];
  return bundle ?? en;
}

/** Full `resources` map for i18next: every supported code points at a bundle (custom JSON or English). */
export function buildI18nextResources(): Record<
  SupportedLanguage,
  { translation: TranslationResource }
> {
  const out = {} as Record<SupportedLanguage, { translation: TranslationResource }>;
  for (const code of SUPPORTED_LANGUAGES) {
    out[code] = { translation: translationFor(code) };
  }
  return out;
}
