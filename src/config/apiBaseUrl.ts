/**
 * Single source of truth for API origin (must match backend `/api` prefix).
 * Set EXPO_PUBLIC_API_BASE_URL in .env or eas.json for a local backend; otherwise the
 * deployed API below is used (works on physical devices / Expo Go without LAN inference).
 */
const DEFAULT_PUBLIC_API = 'https://api.nayft.com/api';

export function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (raw && typeof raw === 'string' && raw.trim()) {
    return raw.replace(/\/$/, '');
  }
  return DEFAULT_PUBLIC_API;
}
