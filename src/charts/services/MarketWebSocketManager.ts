import type { TradeRecord, KlineInterval } from '../types';
import { resolveWsUrl } from './chartApi';

type TradeHandler = (trade: TradeRecord) => void;

interface SubscriptionKey {
  symbol: string;
  interval: KlineInterval;
}

function keyFor(symbol: string, interval: KlineInterval): string {
  return `${symbol}|${interval}`;
}

interface Connection {
  ws: WebSocket;
  handlers: Set<TradeHandler>;
  refCount: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  attempt: number;
  dead: boolean;
}

const connections = new Map<string, Connection>();
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000];

function openConnection(symbol: string, interval: KlineInterval): Connection {
  const conn: Connection = {
    ws: null as unknown as WebSocket,
    handlers: new Set(),
    refCount: 0,
    reconnectTimer: null,
    attempt: 0,
    dead: false,
  };

  function dial() {
    if (conn.dead) return;
    try {
      const ws = new WebSocket(resolveWsUrl());
      conn.ws = ws;

      ws.onopen = () => {
        conn.attempt = 0;
        ws.send(JSON.stringify({ action: 'subscribe', symbol, interval }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as {
            type?: string;
            data?: TradeRecord | TradeRecord[];
          };
          const trades = msg.data ? (Array.isArray(msg.data) ? msg.data : [msg.data]) : [];
          for (const trade of trades) {
            conn.handlers.forEach((h) => {
              try { h(trade); } catch { /* isolate handler errors */ }
            });
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        if (conn.dead) return;
        const delay = BACKOFF_MS[Math.min(conn.attempt, BACKOFF_MS.length - 1)];
        conn.attempt += 1;
        conn.reconnectTimer = setTimeout(dial, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      const delay = BACKOFF_MS[Math.min(conn.attempt, BACKOFF_MS.length - 1)];
      conn.attempt += 1;
      conn.reconnectTimer = setTimeout(dial, delay);
    }
  }

  dial();
  return conn;
}

export const MarketWebSocketManager = {
  subscribe(symbol: string, interval: KlineInterval, handler: TradeHandler): () => void {
    const key = keyFor(symbol, interval);
    let conn = connections.get(key);
    if (!conn) {
      conn = openConnection(symbol, interval);
      connections.set(key, conn);
    }
    conn.handlers.add(handler);
    conn.refCount += 1;

    return () => MarketWebSocketManager.unsubscribe(symbol, interval, handler);
  },

  unsubscribe(symbol: string, interval: KlineInterval, handler: TradeHandler): void {
    const key = keyFor(symbol, interval);
    const conn = connections.get(key);
    if (!conn) return;
    conn.handlers.delete(handler);
    conn.refCount -= 1;
    if (conn.refCount <= 0) {
      conn.dead = true;
      if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
      try { conn.ws?.close(); } catch { /* ignore */ }
      connections.delete(key);
    }
  },
};
