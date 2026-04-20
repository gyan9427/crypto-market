import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { resolveApiBaseUrl } from '@/src/config/apiBaseUrl';

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
  updates: Array<{ symbol: string; price: number; percentChange24h: number }>;
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
let storeVersion = 0;
const storeListeners = new Set<() => void>();

function subscribeStore(onStoreChange: () => void) {
  storeListeners.add(onStoreChange);
  return () => storeListeners.delete(onStoreChange);
}

function getStoreVersion() {
  return storeVersion;
}

function bumpStore() {
  storeVersion += 1;
  storeListeners.forEach((l) => l());
}

function applySnapshot(prices: Record<string, LivePriceQuote>) {
  const upper: Record<string, LivePriceQuote> = {};
  for (const [k, v] of Object.entries(prices)) {
    upper[k.toUpperCase()] = v;
  }
  hubQuotes = { ...hubQuotes, ...upper };
  bumpStore();
}

function applyUpdates(updates: Array<{ symbol: string; price: number; percentChange24h: number }>) {
  const next = { ...hubQuotes };
  for (const u of updates) {
    if (!u.symbol) continue;
    next[u.symbol.toUpperCase()] = {
      price: u.price,
      percentChange24h: u.percentChange24h,
    };
  }
  hubQuotes = next;
  bumpStore();
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
    bumpStore();
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
    bumpStore();
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
    bumpStore();
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
  }, [enabled, clientId, symbolKey]);

  const version = useSyncExternalStore(subscribeStore, getStoreVersion, getStoreVersion);

  const quotes = useMemo(() => {
    void version;
    const out: Record<string, LivePriceQuote> = {};
    for (const sym of normalizedSymbols) {
      const q = hubQuotes[sym];
      if (q) out[sym] = q;
    }
    return out;
  }, [version, symbolKey]);

  const isConnected = ws !== null && ws.readyState === WebSocket.OPEN;

  return { quotes, isConnected };
}
