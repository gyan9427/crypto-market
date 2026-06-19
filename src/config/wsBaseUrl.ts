import { API_BASE_URL } from '@/src/services/apiBase';

/** WebSocket origin (strip trailing `/api`). */
export function resolveWsBaseUrl(): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (base.endsWith('/api')) {
    return base.slice(0, -4);
  }
  return base.replace(/\/api$/, '');
}

export function buildNotificationsWsUrl(_accessToken: string | null): string | null {
  return buildAppWsUrl();
}

export function buildAppWsUrl(): string {
  const origin = resolveWsBaseUrl();
  const proto = origin.startsWith('https') ? 'wss' : 'ws';
  const hostPath = origin.replace(/^https?:\/\//, '');
  return `${proto}://${hostPath}/ws`;
}
