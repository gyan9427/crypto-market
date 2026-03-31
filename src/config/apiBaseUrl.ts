import Constants from 'expo-constants';

/**
 * Single source of truth for API origin (must match backend `/api` prefix).
 * Set EXPO_PUBLIC_API_BASE_URL in .env or eas.json for a local backend; otherwise the
 * deployed API below is used (works on physical devices / Expo Go without LAN inference).
 */
export const DEFAULT_PUBLIC_API = 'https://api.nayft.com/api';

/** localhost / 127.0.0.1 only reach the dev machine from simulators; on a real device they mean the phone itself. */
function isLoopbackDevUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

export function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (raw && typeof raw === 'string' && raw.trim()) {
    const base = raw.replace(/\/$/, '');
    // Physical device + loopback URL → always fail at fetch; fall back to deployed API.
    if (isLoopbackDevUrl(base) && Constants.isDevice) {
      if (__DEV__) {
        console.warn(
          '[api] EXPO_PUBLIC_API_BASE_URL is a loopback URL on a physical device. Using ' +
            DEFAULT_PUBLIC_API +
            '. For a local backend, set EXPO_PUBLIC_API_BASE_URL to http://<your-lan-ip>:<port>/api and restart Metro.'
        );
      }
      return DEFAULT_PUBLIC_API;
    }
    return base;
  }
  return DEFAULT_PUBLIC_API;
}
