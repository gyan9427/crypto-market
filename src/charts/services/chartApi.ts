import type { KlineRecord, TradeRecord, KlineInterval } from '../types';
import { resolveApiBaseUrl } from '@/src/config/apiBaseUrl';
import { fetchKlines as fetchKlinesFromApi } from '@/src/services/api';

/** Re-export for callers that need the same origin as REST API */
export { resolveApiBaseUrl };

/** Resolve WebSocket URL for market trades (same rules as useMarketPriceStream: /ws on host). */
export function resolveWsUrl(): string {
  const base = resolveApiBaseUrl();
  try {
    const u = new URL(base);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    u.pathname = '/ws';
    u.search = '';
    return u.toString();
  } catch {
    const ws = base.replace(/^http/, 'ws');
    return `${ws.replace(/\/$/, '')}/ws`;
  }
}

function parseTrade(raw: Record<string, unknown>): TradeRecord {
  const t = raw.time;
  return {
    time: typeof t === 'number' ? new Date(t) : (t as string),
    price: Number(raw.price),
    quantity: Number(raw.quantity),
    quoteQuantity: raw.quoteQuantity != null ? Number(raw.quoteQuantity) : undefined,
    tradeId: (raw.tradeId as number) ?? (raw.tradeId as string),
    isBuyerMaker: raw.isBuyerMaker as boolean | undefined,
  };
}

export interface FetchKlinesParams {
  symbol: string;
  interval: KlineInterval;
  from?: string;
  to?: string;
  limit?: number;
}

/**
 * Unified klines fetch (same as `src/services/api`); uses cached JSON + minimal fields server-side.
 */
export async function fetchKlines(params: FetchKlinesParams): Promise<KlineRecord[]> {
  const { symbol, interval, from, to, limit = 500 } = params;
  return fetchKlinesFromApi(symbol, interval, limit, from || to ? { from, to } : undefined);
}

export interface FetchTradesParams {
  symbol: string;
  limit?: number;
}

export async function fetchTrades(params: FetchTradesParams): Promise<TradeRecord[]> {
  const { symbol, limit = 10 } = params;
  const base = resolveApiBaseUrl();
  const url = `${base}/charts/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchTrades failed: ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>[] | { data: Record<string, unknown>[] };
  const arr = Array.isArray(data) ? data : (data as { data: Record<string, unknown>[] }).data ?? [];
  return arr.map((r) => parseTrade(r as Record<string, unknown>));
}
