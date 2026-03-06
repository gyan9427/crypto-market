import type { KlineRecord, TradeRecord, KlinesParams, KlineInterval } from '../types';

/** Resolve REST API base URL (override via env or config) */
export function resolveApiBaseUrl(): string {
  if (typeof process !== 'undefined' && (process as { env?: Record<string, string> }).env?.EXPO_PUBLIC_API_URL) {
    return (process as { env?: Record<string, string> }).env.EXPO_PUBLIC_API_URL!;
  }
  return 'http://localhost:4001';
}

/** Resolve WebSocket URL for market trades */
export function resolveWsUrl(): string {
  const base = resolveApiBaseUrl();
  const ws = base.replace(/^http/, 'ws');
  return `${ws}/ws`;
}

function parseKline(raw: Record<string, unknown>): KlineRecord {
  const ot = raw.openTime;
  return {
    openTime: typeof ot === 'number' ? new Date(ot) : (ot as string),
    open: Number(raw.open),
    high: Number(raw.high),
    low: Number(raw.low),
    close: Number(raw.close),
    volume: Number(raw.volume),
    quoteVolume: raw.quoteVolume != null ? Number(raw.quoteVolume) : undefined,
    tradeCount: raw.tradeCount != null ? Number(raw.tradeCount) : undefined,
  };
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

const BINANCE_INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '1h': '1h',
  '1d': '1d',
  '1w': '1w',
};

async function fetchKlinesFromBinance(
  symbol: string,
  interval: string,
  limit: number,
  to?: string
): Promise<KlineRecord[]> {
  const binanceSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
  const binanceInterval = BINANCE_INTERVAL_MAP[interval] || '1h';
  let url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
  if (to) url += `&endTime=${to}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const raw = (await res.json()) as (string | number)[][];
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => ({
    openTime: new Date(row[0] as number),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]) || 0,
  }));
}

export async function fetchKlines(params: FetchKlinesParams): Promise<KlineRecord[]> {
  const { symbol, interval, from, to, limit = 500 } = params;
  const base = resolveApiBaseUrl();
  const search = new URLSearchParams();
  search.set('symbol', symbol);
  search.set('interval', interval);
  if (from) search.set('from', from);
  if (to) search.set('to', to);
  search.set('limit', String(limit));
  const url = `${base}/charts/klines?${search.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetchKlines failed: ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>[] | { data: Record<string, unknown>[] };
    const arr = Array.isArray(data) ? data : (data as { data: Record<string, unknown>[] }).data ?? [];
    return arr.map((r) => parseKline(r as Record<string, unknown>));
  } catch {
    return fetchKlinesFromBinance(symbol, interval, limit, to ? String(new Date(to).getTime()) : undefined);
  }
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
