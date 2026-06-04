import { fetchJsonCached } from '@/src/services/requestCache';
import { API_BASE_URL } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';

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
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = useAuthStore.getState().token;
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchPortfolioContext(): Promise<PortfolioContextDto | null> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/portfolio/intelligence/context`, {
    headers: await authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function fetchPortfolioContextCached(): Promise<PortfolioContextDto | null> {
  const token = useAuthStore.getState().token ?? 'guest';
  return fetchJsonCached<PortfolioContextDto | null>(
    `pi:context:${token}`,
    () => fetchPortfolioContext(),
    30_000
  );
}
