import { API_BASE_URL } from '@/src/services/api';

/** WebSocket origin (strip trailing `/api`). */
export function resolveWsBaseUrl(): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (base.endsWith('/api')) {
    return base.slice(0, -4);
  }
  return base.replace(/\/api$/, '');
}

export function buildNotificationsWsUrl(accessToken: string | null): string | null {
  if (!accessToken) return null;
  const origin = resolveWsBaseUrl();
  const proto = origin.startsWith('https') ? 'wss' : 'ws';
  const hostPath = origin.replace(/^https?:\/\//, '');
  return `${proto}://${hostPath}/ws?token=${encodeURIComponent(accessToken)}`;
}

export function buildAppWsUrl(): string {
  const origin = resolveWsBaseUrl();
  const proto = origin.startsWith('https') ? 'wss' : 'ws';
  const hostPath = origin.replace(/^https?:\/\//, '');
  return `${proto}://${hostPath}/ws`;
}
