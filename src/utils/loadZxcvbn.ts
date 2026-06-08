import { ensureZxcvbnInitialized } from '@nayft/password-policy';

let loadPromise: Promise<void> | null = null;

/**
 * Lazy-load zxcvbn dictionaries on first password field focus.
 */
export function loadZxcvbn(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.resolve().then(() => {
      ensureZxcvbnInitialized();
    });
  }
  return loadPromise;
}
