import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveWsUrl } from '../services/api';

export interface PriceData {
  price: number;
  percentChange24h: number;
}

export function useMarketPrices(symbols?: string[]): {
  prices: Map<string, PriceData>;
  isConnected: boolean;
} {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const symbolsRef = useRef<string[]>([]);

  const connect = useCallback(() => {
    const url = resolveWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      if (symbolsRef.current.length > 0) {
        ws.send(JSON.stringify({ type: 'subscribe', symbols: symbolsRef.current }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'snapshot' && msg.prices) {
          setPrices(new Map(Object.entries(msg.prices)));
        } else if (msg.type === 'price' && Array.isArray(msg.updates)) {
          setPrices((prev) => {
            const next = new Map(prev);
            for (const u of msg.updates) {
              if (u.symbol != null && typeof u.price === 'number') {
                next.set(u.symbol, {
                  price: u.price,
                  percentChange24h: typeof u.percentChange24h === 'number' ? u.percentChange24h : 0,
                });
              }
            }
            return next;
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 30000);
      reconnectAttemptRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  useEffect(() => {
    const syms = symbols ?? [];
    symbolsRef.current = syms;
    if (wsRef.current?.readyState === WebSocket.OPEN && syms.length > 0) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbols: syms }));
    }
  }, [symbols]);

  return { prices, isConnected };
}
