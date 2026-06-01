import type { KlineRecord, TradeRecord, KlineInterval } from '../types';
import { resolveApiBaseUrl } from '@/src/config/apiBaseUrl';
import { fetchKlines as fetchKlinesFromApi, toChartSymbol } from '@/src/services/api';
import { fetchJsonCached } from '@/src/services/requestCache';

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

/** Per-interval cache TTLs matching backend ingestion cadence. */
const CHART_TTL_MS: Record<KlineInterval, number> = {
  '1m': 30_000,
  '5m': 45_000,
  '15m': 60_000,
  '1h': 90_000,
  '4h': 120_000,
  '1d': 120_000,
  '1w': 180_000,
};

export interface FetchKlinesParams {
  symbol: string;
  interval: KlineInterval;
  from?: string;
  to?: string;
  limit?: number;
  exchange?: string;
}

/**
 * Unified klines fetch with per-interval TTL caching.
 * Single cache layer via fetchJsonCached (in-flight dedup + TTL).
 */
export async function fetchKlines(params: FetchKlinesParams): Promise<KlineRecord[]> {
  const { symbol, interval, from, to, limit = 500, exchange } = params;
  const chartSymbol = toChartSymbol(symbol);
  if (!chartSymbol) return [];
  const base = resolveApiBaseUrl();
  const search = new URLSearchParams();
  search.set('symbol', chartSymbol);
  search.set('interval', interval);
  search.set('limit', String(limit));
  search.set('fields', 'minimal');
  if (from) search.set('from', from);
  if (to) search.set('to', to);
  if (exchange) search.set('exchange', exchange);
  const url = `${base}/charts/klines?${search.toString()}`;
  const data = await fetchJsonCached<unknown>(url, { cacheTtlMs: CHART_TTL_MS[interval] });
  const arr = Array.isArray(data) ? data : [];
  return arr.map((raw) => {
    const r = raw as Record<string, unknown>;
    const ot = r.openTime;
    const openTime =
      typeof ot === 'number' ? ot : typeof ot === 'string' ? new Date(ot).getTime() : (ot as Date).getTime();
    return {
      openTime,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
      quoteVolume: r.quoteVolume != null ? Number(r.quoteVolume) : undefined,
      tradeCount: r.tradeCount != null ? Number(r.tradeCount) : undefined,
    };
  });
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
