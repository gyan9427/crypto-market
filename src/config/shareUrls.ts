import { Platform } from 'react-native';

const FALLBACK_LANDING = 'https://nayft.com';

export function getAppStoreUrl(): string {
  const url = process.env.EXPO_PUBLIC_APP_STORE_URL?.trim();
  return url || FALLBACK_LANDING;
}

export function getPlayStoreUrl(): string {
  const url =
    process.env.EXPO_PUBLIC_PLAY_STORE_URL?.trim() ||
    process.env.EXPO_PUBLIC_STORE_URL?.trim();
  return url || FALLBACK_LANDING;
}

export function getNayftDownloadUrl(): string {
  const url = process.env.EXPO_PUBLIC_NAYFT_DOWNLOAD_URL?.trim();
  return url || FALLBACK_LANDING;
}

/** Opens the best store/deep link for the current platform, or the universal landing page. */
export function resolveShareFooterLink(): string {
  if (Platform.OS === 'ios') return getAppStoreUrl();
  if (Platform.OS === 'android') return getPlayStoreUrl();
  return getNayftDownloadUrl();
}

/** Canonical NAYFT share landing URL for an article (used when shareMeta is absent). */
export function buildNayftShareUrl(articleId: string): string {
  const base = getNayftDownloadUrl().replace(/\/+$/, '');
  return `${base}/share/${encodeURIComponent(articleId)}`;
}
