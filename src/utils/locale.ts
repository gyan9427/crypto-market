import * as Localization from 'expo-localization';
import {
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/src/constants/languages';

/** Base language subtag, lowercased (e.g. `en-IN` → `en`). */
export function normalizeLocaleTag(tag: string): string {
  const base = tag.split(/[-_]/)[0]?.toLowerCase() ?? '';
  return base;
}

/** First supported language from device locales, else `en`. */
export function resolveDeviceLanguage(): SupportedLanguage {
  const locales = Localization.getLocales();
  const candidates: string[] = [];
  for (const l of locales) {
    if (l?.languageTag) candidates.push(l.languageTag);
    if (l?.languageCode) candidates.push(l.languageCode);
  }

  for (const tag of candidates) {
    const base = normalizeLocaleTag(tag);
    if (isSupportedLanguage(base)) return base;
  }
  return 'en';
}
