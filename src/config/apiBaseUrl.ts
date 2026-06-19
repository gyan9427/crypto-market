import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Single source of truth for API origin (must match backend `/api` prefix).
 * Set EXPO_PUBLIC_API_BASE_URL in .env or eas.json for a local backend; otherwise the
 * deployed API below is used (works on physical devices / Expo Go without LAN inference).
 */
export const DEFAULT_PUBLIC_API = 'https://api.nayft.com/api';

const ANDROID_EMULATOR_HOST = '10.0.2.2';

/** Hosts that only make sense on the dev machine, not as a client target on a phone. */
function isUnusableClientHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '0.0.0.0';
}

/** 10.0.2.2 is the Android emulator alias for host loopback — invalid on a physical device. */
function isEmulatorOnlyHost(hostname: string): boolean {
  return hostname.toLowerCase() === ANDROID_EMULATOR_HOST;
}

function isAndroidEmulator(): boolean {
  return Platform.OS === 'android' && !Constants.isDevice;
}

/** Metro / Expo Go host (e.g. "192.168.0.9:8081") — same machine as the local backend. */
function getMetroDevHost(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri?.split('/')[0] ??
    null;

  if (!debuggerHost || typeof debuggerHost !== 'string') return null;
  const host = debuggerHost.split(':')[0]?.trim();
  if (!host || isUnusableClientHost(host)) return null;
  return host;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Rewrite dev URLs so they work on emulators and physical devices.
 * `0.0.0.0` is a server bind address and must never be used as a fetch target.
 */
function rewriteDevApiUrl(base: string): string {
  try {
    const u = new URL(base);
    const host = u.hostname.toLowerCase();

    if (!isUnusableClientHost(host) && !(isEmulatorOnlyHost(host) && Constants.isDevice)) {
      return stripTrailingSlash(base);
    }

    if (isAndroidEmulator()) {
      u.hostname = ANDROID_EMULATOR_HOST;
      if (__DEV__) {
        console.warn(
          `[api] Rewrote dev API host "${host}" → ${ANDROID_EMULATOR_HOST} (Android emulator)`
        );
      }
      return stripTrailingSlash(u.toString());
    }

    const metroHost = getMetroDevHost();
    if (metroHost) {
      u.hostname = metroHost;
      if (__DEV__) {
        console.warn(`[api] Rewrote dev API host "${host}" → ${metroHost} (Metro dev machine)`);
      }
      return stripTrailingSlash(u.toString());
    }

    if (Constants.isDevice) {
      if (__DEV__) {
        console.warn(
          '[api] EXPO_PUBLIC_API_BASE_URL points at the dev machine but Metro host is unknown. Using ' +
            DEFAULT_PUBLIC_API +
            '. For a local backend, use your PC LAN IP in .env (e.g. http://192.168.x.x:4001/api) and restart Metro.'
        );
      }
      return DEFAULT_PUBLIC_API;
    }

    // iOS Simulator / web — localhost is valid
    if (isUnusableClientHost(host)) {
      u.hostname = 'localhost';
      return stripTrailingSlash(u.toString());
    }
    return stripTrailingSlash(base);
  } catch {
    return stripTrailingSlash(base);
  }
}

export function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (raw && typeof raw === 'string' && raw.trim()) {
    return rewriteDevApiUrl(raw.trim());
  }
  return DEFAULT_PUBLIC_API;
}
