import { useEffect, useMemo, useRef, useState } from 'react';
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

/**
 * Reusable market quote stream. Opens one socket and keeps subscribed symbols in sync.
 */
export function useMarketPriceStream(
  symbols: string[],
  options: MarketPriceStreamOptions = {}
): {
  quotes: Record<string, LivePriceQuote>;
  isConnected: boolean;
} {
  const { enabled = true } = options;
  const [quotes, setQuotes] = useState<Record<string, LivePriceQuote>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedSymbols = useMemo(
    () => Array.from(new Set(symbols.filter(Boolean).map((s) => s.trim().toUpperCase()))),
    [symbols]
  );
  const normalizedSymbolsRef = useRef<string[]>(normalizedSymbols);
  normalizedSymbolsRef.current = normalizedSymbols;

  useEffect(() => {
    if (!enabled || normalizedSymbolsRef.current.length === 0) {
      setIsConnected(false);
      return;
    }

    let disposed = false;

    const sendSubscribe = () => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: 'subscribe', symbols: normalizedSymbolsRef.current }));
    };

    const connect = () => {
      if (disposed) return;
      const ws = new WebSocket(resolveWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setIsConnected(true);
        sendSubscribe();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as StreamMessage;
          if (msg.type === 'snapshot' && msg.prices) {
            setQuotes((prev) => ({ ...prev, ...msg.prices }));
            return;
          }
          if (msg.type === 'price' && Array.isArray(msg.updates)) {
            setQuotes((prev) => {
              const next = { ...prev };
              for (const u of msg.updates) {
                if (!u.symbol) continue;
                next[u.symbol.toUpperCase()] = {
                  price: u.price,
                  percentChange24h: u.percentChange24h,
                };
              }
              return next;
            });
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (disposed) return;
        reconnectRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // close triggers reconnect strategy
        ws.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      setIsConnected(false);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, normalizedSymbols.length]);

  useEffect(() => {
    if (!enabled || normalizedSymbols.length === 0) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'subscribe', symbols: normalizedSymbols }));
  }, [enabled, normalizedSymbols]);

  return { quotes, isConnected };
}
