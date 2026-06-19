import { API_BASE_URL } from '@/src/services/apiBase';
import { getAuthToken } from '@/src/services/authSession';
import {
  clearPortfolioContextCache,
  readPortfolioContextCache,
  writePortfolioContextCache,
  type PortfolioContextDto,
} from '@/src/services/portfolioContextCache';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';
import { fetchWithTimeout } from '@/src/runtime/asyncRequestGuard';

export type { PortfolioContextDto } from '@/src/services/portfolioContextCache';

async function authHeaders(): Promise<Record<string, string>> {
  const token = getAuthToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchPortfolioContext(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioContextDto | null> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const res = await fetchWithTimeout(`${base}/portfolio/intelligence/context`, {
    headers: await authHeaders(),
    signal: options?.signal,
    timeoutMs: 8_000,
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function fetchPortfolioContextCached(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioContextDto | null> {
  const tokenKey = getAuthToken() ?? 'guest';
  const now = Date.now();
  const cached = readPortfolioContextCache(tokenKey, now);
  if (cached !== undefined) {
    return cached;
  }
  incrementPerfCounter('piFetch');
  const data = await fetchPortfolioContext(options);
  writePortfolioContextCache(tokenKey, data, now + 30_000);
  return data;
}

/** Called when WS `analytics_revision` arrives — bust PI context cache and optionally refetch. */
export function invalidatePortfolioContextCache(opts?: { refetch?: boolean }): void {
  clearPortfolioContextCache();
  if (opts?.refetch) {
    void fetchPortfolioContextCached();
  }
}

export { clearPortfolioContextCache } from '@/src/services/portfolioContextCache';
