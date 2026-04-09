/**
 * App UI language codes (BCP 47 base tags).
 * Keep aligned with backend `supportedLanguages` when syncing preferences.
 */
export const SUPPORTED_LANGUAGES = [
  'en',
  'hi',
  'ta',
  'te',
  'kn',
  'ml',
  'bn',
  'mr',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

export type LanguageOption = {
  code: SupportedLanguage;
  /** Native / endonym label shown in the picker */
  label: string;
  /** English name for subtitle and Profile row value */
  englishLabel: string;
};

/** Stable order for lists; add new languages here only. */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'en', label: 'English', englishLabel: 'English' },
  { code: 'hi', label: 'हिन्दी', englishLabel: 'Hindi' },
  { code: 'ta', label: 'தமிழ்', englishLabel: 'Tamil' },
  { code: 'te', label: 'తెలుగు', englishLabel: 'Telugu' },
  { code: 'kn', label: 'ಕನ್ನಡ', englishLabel: 'Kannada' },
  { code: 'ml', label: 'മലയാളം', englishLabel: 'Malayalam' },
  { code: 'bn', label: 'বাংলা', englishLabel: 'Bengali' },
  { code: 'mr', label: 'मराठी', englishLabel: 'Marathi' },
] as const;

export function getLanguageOption(
  code: SupportedLanguage
): LanguageOption | undefined {
  return LANGUAGE_OPTIONS.find((o) => o.code === code);
}
