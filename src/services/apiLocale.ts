import type { SupportedLanguage } from '@/src/constants/languages';

/** Updated only via `applyResolvedLanguage` in the app store — avoids circular imports with `api.ts`. */
let current: SupportedLanguage = 'en';

export function setApiLocaleLanguage(lang: SupportedLanguage): void {
  current = lang;
}

export function getApiLocaleLanguage(): SupportedLanguage {
  return current;
}
