import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { resolveApiBaseUrl } from '@/src/config/apiBaseUrl';

// Rolling price history per symbol — up to 60 samples, throttled to ≥10 s apart.
// 60 points × 10 s ≈ 10 minutes of live ticks (visual sparkline movement).
const hubPriceHistory = new Map<string, number[]>();
const lastAppendMs = new Map<string, number>();
const HISTORY_MAX = 60;
const HISTORY_SAMPLE_INTERVAL_MS = 10_000;

function appendHistory(symbol: string, price: number): boolean {
  if (!Number.isFinite(price)) return false;
  const now = Date.now();
  const last = lastAppendMs.get(symbol) ?? 0;
  if (now - last < HISTORY_SAMPLE_INTERVAL_MS) return false;
  lastAppendMs.set(symbol, now);
  const prev = hubPriceHistory.get(symbol) ?? [];
  hubPriceHistory.set(
    symbol,
    prev.length >= HISTORY_MAX ? [...prev.slice(1), price] : [...prev, price]
  );
  return true;
}

export function seedPriceHistory(symbol: string, prices: number[]): void {
  const upper = symbol.toUpperCase();
  if (!hubPriceHistory.has(upper) || (hubPriceHistory.get(upper)?.length ?? 0) === 0) {
    hubPriceHistory.set(upper, prices.slice(-HISTORY_MAX));
  }
}

export function getPriceHistory(symbol: string): number[] {
  return hubPriceHistory.get(symbol.toUpperCase()) ?? [];
}

export interface LivePriceQuote {
  price: number;
  percentChange24h: number;
}

interface MarketPriceStreamOptions {
  enabled?: boolean;
}

interface SnapshotMessage {
  type: 'snapshot';
  prices: Record<string, LivePriceQuote>;
}

interface PriceUpdateMessage {
  type: 'price';
  updates: { symbol: string; price: number; percentChange24h: number }[];
}

type StreamMessage = SnapshotMessage | PriceUpdateMessage;

function resolveWsUrl(): string {
  const base = resolveApiBaseUrl();
  const parsed = new URL(base.startsWith('http') ? base : `https://${base}`);
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  parsed.pathname = '/ws';
  parsed.search = '';
  return parsed.toString();
}

// ── Shared hub: one WebSocket, merged subscriptions, all quotes ───────────────

let hubQuotes: Record<string, LivePriceQuote> = {};
let connectionVersion = 0;
const connectionListeners = new Set<() => void>();
const symbolVersions = new Map<string, number>();
const symbolListeners = new Map<string, Set<() => void>>();

function bumpConnectionVersion() {
  connectionVersion += 1;
  connectionListeners.forEach((listener) => listener());
}

function bumpSymbolVersion(symbol: string) {
  symbolVersions.set(symbol, (symbolVersions.get(symbol) ?? 0) + 1);
  const listeners = symbolListeners.get(symbol);
  listeners?.forEach((listener) => listener());
}

function quotesEqual(a: LivePriceQuote | undefined, b: LivePriceQuote | undefined): boolean {
  return a?.price === b?.price && a?.percentChange24h === b?.percentChange24h;
}

function subscribeSymbols(symbols: string[], onStoreChange: () => void) {
  connectionListeners.add(onStoreChange);
  for (const symbol of symbols) {
    let listeners = symbolListeners.get(symbol);
    if (!listeners) {
      listeners = new Set();
      symbolListeners.set(symbol, listeners);
    }
    listeners.add(onStoreChange);
  }

  return () => {
    connectionListeners.delete(onStoreChange);
    for (const symbol of symbols) {
      const listeners = symbolListeners.get(symbol);
      if (!listeners) continue;
      listeners.delete(onStoreChange);
      if (listeners.size === 0) {
        symbolListeners.delete(symbol);
      }
    }
  };
}

function applySnapshot(prices: Record<string, LivePriceQuote>) {
  const upper: Record<string, LivePriceQuote> = {};
  for (const [k, v] of Object.entries(prices)) {
    upper[k.toUpperCase()] = v;
  }
  const previousQuotes = hubQuotes;
  const nextQuotes = { ...hubQuotes, ...upper };
  hubQuotes = nextQuotes;

  for (const [symbol, quote] of Object.entries(upper)) {
    appendHistory(symbol, quote.price);
    if (!quotesEqual(previousQuotes[symbol], quote)) {
      bumpSymbolVersion(symbol);
    }
  }
}

function applyUpdates(updates: { symbol: string; price: number; percentChange24h: number }[]) {
  const next = { ...hubQuotes };
  for (const u of updates) {
    if (!u.symbol) continue;
    const symbol = u.symbol.toUpperCase();
    const nextQuote = {
      price: u.price,
      percentChange24h: u.percentChange24h,
    };
    const changed = !quotesEqual(next[symbol], nextQuote);
    if (changed) {
      next[symbol] = nextQuote;
      const historyChanged = appendHistory(symbol, u.price);
      if (historyChanged) {
        // history version is the same as symbol version — bump once covers both
      }
      bumpSymbolVersion(symbol);
    }
  }
  hubQuotes = next;
}

const clientSymbols = new Map<number, string[]>();
let hubClientIdSeq = 0;
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let socketSession = 0;

function mergedSymbols(): string[] {
  const s = new Set<string>();
  for (const arr of clientSymbols.values()) {
    for (const sym of arr) s.add(sym);
  }
  return Array.from(s);
}

function sendSubscribe() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const symbols = mergedSymbols();
  ws.send(JSON.stringify({ type: 'subscribe', symbols }));
}

function syncConnection() {
  const want = mergedSymbols();
  if (want.length === 0) {
    socketSession += 1;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    bumpConnectionVersion();
    return;
  }

  if (ws?.readyState === WebSocket.OPEN) {
    sendSubscribe();
    return;
  }

  if (ws?.readyState === WebSocket.CONNECTING) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const mySession = ++socketSession;
  const socket = new WebSocket(resolveWsUrl());
  ws = socket;

  socket.onopen = () => {
    if (mySession !== socketSession) return;
    bumpConnectionVersion();
    sendSubscribe();
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(String(event.data)) as StreamMessage;
      if (msg.type === 'snapshot' && msg.prices) {
        applySnapshot(msg.prices);
        return;
      }
      if (msg.type === 'price' && Array.isArray(msg.updates)) {
        applyUpdates(msg.updates);
      }
    } catch {
      // ignore malformed messages
    }
  };

  socket.onclose = () => {
    if (mySession !== socketSession) return;
    ws = null;
    bumpConnectionVersion();
    if (mergedSymbols().length === 0) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      syncConnection();
    }, 2000);
  };

  socket.onerror = () => {
    socket.close();
  };
}

function setClientSymbols(clientId: number, symbols: string[]) {
  if (symbols.length === 0) {
    clientSymbols.delete(clientId);
  } else {
    clientSymbols.set(clientId, symbols);
  }
  syncConnection();
}

function removeClient(clientId: number) {
  clientSymbols.delete(clientId);
  syncConnection();
}

/**
 * Market quote stream backed by a single shared WebSocket. Multiple hook instances
 * merge their symbol lists into one subscribe payload.
 */
export function useMarketPriceStream(
  symbols: string[],
  options: MarketPriceStreamOptions = {}
): {
  quotes: Record<string, LivePriceQuote>;
  isConnected: boolean;
} {
  const { enabled = true } = options;
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) {
    idRef.current = ++hubClientIdSeq;
  }
  const clientId = idRef.current;

  const symbolKey = useMemo(() => {
    const set = new Set(symbols.filter(Boolean).map((s) => s.trim().toUpperCase()));
    return Array.from(set).sort().join('|');
  }, [symbols]);

  const normalizedSymbols = useMemo(
    () => (symbolKey.length > 0 ? symbolKey.split('|') : []),
    [symbolKey]
  );

  useEffect(() => {
    if (!enabled || normalizedSymbols.length === 0) {
      removeClient(clientId);
      return () => removeClient(clientId);
    }
    setClientSymbols(clientId, normalizedSymbols);
    return () => removeClient(clientId);
  }, [enabled, clientId, normalizedSymbols]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeSymbols(normalizedSymbols, onStoreChange),
    [normalizedSymbols]
  );
  const getSnapshot = useCallback(
    () => `${connectionVersion}:${normalizedSymbols.map((symbol) => symbolVersions.get(symbol) ?? 0).join('|')}`,
    [normalizedSymbols]
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const quotes = useMemo(() => {
    void snapshot;
    const out: Record<string, LivePriceQuote> = {};
    for (const sym of normalizedSymbols) {
      const q = hubQuotes[sym];
      if (q) out[sym] = q;
    }
    return out;
  }, [snapshot, normalizedSymbols]);

  const isConnected = ws !== null && ws.readyState === WebSocket.OPEN;

  return { quotes, isConnected };
}

/**
 * Returns the rolling live-price history for a single symbol as a number[].
 * Re-renders whenever a new sample is appended (throttled to HISTORY_SAMPLE_INTERVAL_MS).
 */
export function useSparklineHistory(symbol: string): number[] {
  const upper = useMemo(() => symbol.trim().toUpperCase(), [symbol]);

  const subscribe = useCallback(
    (cb: () => void) => subscribeSymbols([upper], cb),
    [upper]
  );
  const getVersion = useCallback(
    () => symbolVersions.get(upper) ?? 0,
    [upper]
  );
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);

  return useMemo(() => {
    void version;
    return hubPriceHistory.get(upper) ?? [];
  }, [version, upper]);
}
