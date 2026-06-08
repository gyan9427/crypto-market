import { API_BASE_URL } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';
import { fetchWithTimeout } from '@/src/runtime/asyncRequestGuard';

let contextCache: { tokenKey: string; data: PortfolioContextDto | null; expires: number } | null = null;

export type PortfolioContextDto = {
  schemaVersion: number;
  userId: string;
  heldSymbols: string[];
  heldCoinIds: string[];
  weightBySymbol: Record<string, number>;
  ingestRevision: number;
  analyticsRevision: number;
  stale: boolean;
  staleMapping: boolean;
  narrativeVector?: Record<string, number>;
  convictionVector?: Record<string, number>;
  topThemes?: string[];
  healthScore?: number | null;
  identityId?: string;
  partial?: boolean;
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = useAuthStore.getState().token;
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
  const tokenKey = useAuthStore.getState().token ?? 'guest';
  const now = Date.now();
  if (contextCache && contextCache.tokenKey === tokenKey && contextCache.expires > now) {
    return contextCache.data;
  }
  incrementPerfCounter('piFetch');
  const data = await fetchPortfolioContext(options);
  contextCache = { tokenKey, data, expires: now + 30_000 };
  return data;
}

/** Called when WS `analytics_revision` arrives — bust PI context cache and optionally refetch. */
export function invalidatePortfolioContextCache(opts?: { refetch?: boolean }): void {
  contextCache = null;
  if (opts?.refetch) {
    void fetchPortfolioContextCached();
  }
}

export function clearPortfolioContextCache(): void {
  contextCache = null;
}
