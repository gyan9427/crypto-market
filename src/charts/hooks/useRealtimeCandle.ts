import { useEffect, useRef, useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { KlineRecord, TradeRecord, KlineInterval } from '../types';
import { resolveWsUrl } from '../services/chartApi';
import { fetchTrades } from '../services/chartApi';
import { INTERVAL_MS } from '../constants';

export interface UseRealtimeCandleParams {
  symbol: string;
  interval: KlineInterval;
  lastCandle: KlineRecord | null;
  onNewCandle?: (candle: KlineRecord) => void;
}

function toMs(v: Date | string): number {
  return typeof v === 'string' ? new Date(v).getTime() : v.getTime();
}

function mergeTradeIntoCandle(candle: KlineRecord, trade: TradeRecord): KlineRecord {
  const price = trade.price;
  const qty = trade.quantity;
  return {
    ...candle,
    high: Math.max(candle.high, price),
    low: Math.min(candle.low, price),
    close: price,
    volume: candle.volume + qty,
    tradeCount: (candle.tradeCount ?? 0) + 1,
  };
}

export function useRealtimeCandle(params: UseRealtimeCandleParams): {
  liveCandle: ReturnType<typeof useSharedValue<KlineRecord | null>>;
} {
  const { symbol, interval, lastCandle, onNewCandle } = params;
  const liveCandle = useSharedValue<KlineRecord | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef(0);
  const lastCandleRef = useRef<KlineRecord | null>(lastCandle);

  lastCandleRef.current = lastCandle;

  const connectRef = useRef<() => void>(() => {});

  const tryReconnect = useCallback(() => {
    const delays = [1000, 2000, 4000, 8000, 16000, 30000];
    const idx = Math.min(reconnectRef.current, delays.length - 1);
    const delay = delays[idx];
    reconnectRef.current += 1;
    setTimeout(() => connectRef.current(), delay);
  }, []);

  const connect = useCallback(() => {
    try {
      const url = resolveWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        ws.send(JSON.stringify({ action: 'subscribe', symbol, interval }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { type?: string; data?: TradeRecord | TradeRecord[] };
          const trades = msg.data
            ? Array.isArray(msg.data)
              ? msg.data
              : [msg.data]
            : [];
          for (const trade of trades) {
            const t = toMs(trade.time);
            const intervalMs = INTERVAL_MS[interval];
            const base = Math.floor(t / intervalMs) * intervalMs;
            const baseDate = new Date(base);

            const current = liveCandle.value ?? lastCandleRef.current;
            if (current) {
              const currentBase = toMs(current.openTime);
              const currentBaseAligned = Math.floor(currentBase / intervalMs) * intervalMs;
              if (base > currentBaseAligned) {
                if (onNewCandle) onNewCandle(current);
                liveCandle.value = {
                  openTime: baseDate,
                  open: trade.price,
                  high: trade.price,
                  low: trade.price,
                  close: trade.price,
                  volume: trade.quantity,
                  tradeCount: 1,
                };
              } else {
                liveCandle.value = mergeTradeIntoCandle(current, trade);
              }
            } else {
              liveCandle.value = {
                openTime: baseDate,
                open: trade.price,
                high: trade.price,
                low: trade.price,
                close: trade.price,
                volume: trade.quantity,
                tradeCount: 1,
              };
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        tryReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      tryReconnect();
    }
  }, [symbol, interval, onNewCandle, liveCandle, tryReconnect]);

  connectRef.current = connect;

  useEffect(() => {
    liveCandle.value = lastCandle;
  }, [lastCandle, liveCandle]);

  useEffect(() => {
    connect();

    const poll = setInterval(async () => {
      try {
        const trades = await fetchTrades({ symbol, limit: 10 });
        if (trades.length === 0) return;
        const intervalMs = INTERVAL_MS[interval];
        for (const trade of trades.reverse()) {
          const t = toMs(trade.time);
          const base = Math.floor(t / intervalMs) * intervalMs;
          const baseDate = new Date(base);
          const current = liveCandle.value ?? lastCandleRef.current;
          if (current) {
            const currentBase = toMs(current.openTime);
            const currentBaseAligned = Math.floor(currentBase / intervalMs) * intervalMs;
            if (base > currentBaseAligned) {
              if (onNewCandle) onNewCandle(current);
              liveCandle.value = {
                openTime: baseDate,
                open: trade.price,
                high: trade.price,
                low: trade.price,
                close: trade.price,
                volume: trade.quantity,
                tradeCount: 1,
              };
            } else {
              liveCandle.value = mergeTradeIntoCandle(current, trade);
            }
          } else {
            liveCandle.value = {
              openTime: baseDate,
              open: trade.price,
              high: trade.price,
              low: trade.price,
              close: trade.price,
              volume: trade.quantity,
              tradeCount: 1,
            };
          }
        }
      } catch {
        // ignore
      }
    }, 2000);
    pollRef.current = poll;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      liveCandle.value = null;
    };
  }, [symbol, interval, connect, liveCandle, onNewCandle]);

  return { liveCandle };
}
