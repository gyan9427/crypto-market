import { useEffect, useRef, useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { KlineRecord, TradeRecord, KlineInterval } from '../types';
import { fetchTrades } from '../services/chartApi';
import { MarketWebSocketManager } from '../services/MarketWebSocketManager';
import { INTERVAL_MS } from '../constants';

export interface UseRealtimeCandleParams {
  symbol: string;
  interval: KlineInterval;
  lastCandle: KlineRecord | null;
  onNewCandle?: (candle: KlineRecord) => void;
}

function mergeTradeIntoCandle(candle: KlineRecord, trade: TradeRecord): KlineRecord {
  return {
    ...candle,
    high: Math.max(candle.high, trade.price),
    low: Math.min(candle.low, trade.price),
    close: trade.price,
    volume: candle.volume + trade.quantity,
    tradeCount: (candle.tradeCount ?? 0) + 1,
  };
}

function tradeTimeMs(t: Date | string): number {
  return typeof t === 'string' ? new Date(t).getTime() : t.getTime();
}

function candleFromTrade(trade: TradeRecord, intervalMs: number): KlineRecord {
  const t = tradeTimeMs(trade.time);
  const base = Math.floor(t / intervalMs) * intervalMs;
  return {
    openTime: base,
    open: trade.price,
    high: trade.price,
    low: trade.price,
    close: trade.price,
    volume: trade.quantity,
    tradeCount: 1,
  };
}

export function useRealtimeCandle(params: UseRealtimeCandleParams): {
  liveCandle: ReturnType<typeof useSharedValue<KlineRecord | null>>;
} {
  const { symbol, interval, lastCandle, onNewCandle } = params;
  const liveCandle = useSharedValue<KlineRecord | null>(null);
  const lastCandleRef = useRef<KlineRecord | null>(lastCandle);
  const onNewCandleRef = useRef(onNewCandle);

  lastCandleRef.current = lastCandle;
  onNewCandleRef.current = onNewCandle;

  const processTrade = useCallback(
    (trade: TradeRecord, currentLive: KlineRecord | null): KlineRecord => {
      const intervalMs = INTERVAL_MS[interval];
      const tradeMs = tradeTimeMs(trade.time);
      const base = Math.floor(tradeMs / intervalMs) * intervalMs;
      const current = currentLive ?? lastCandleRef.current;
      if (current) {
        const currentBase = Math.floor(current.openTime / intervalMs) * intervalMs;
        if (base > currentBase) {
          onNewCandleRef.current?.(current);
          return candleFromTrade(trade, intervalMs);
        }
        return mergeTradeIntoCandle(current, trade);
      }
      return candleFromTrade(trade, intervalMs);
    },
    [interval]
  );

  useEffect(() => {
    liveCandle.value = lastCandle;
  }, [lastCandle, liveCandle]);

  useEffect(() => {
    // Cold-start seed: fetch recent trades once before the first WebSocket message
    // so liveCandle has an initial value immediately on mount.
    fetchTrades({ symbol, limit: 20 })
      .then((trades) => {
        if (trades.length === 0 || liveCandle.value !== null) return;
        let candle: KlineRecord | null = null;
        for (const trade of trades) {
          candle = processTrade(trade, candle);
        }
        if (candle && liveCandle.value === null) {
          liveCandle.value = candle;
        }
      })
      .catch(() => {
        // seed failure is non-fatal; WebSocket will fill in
      });

    // Single shared WebSocket via reference-counted singleton
    const unsubscribe = MarketWebSocketManager.subscribe(symbol, interval, (trade) => {
      liveCandle.value = processTrade(trade, liveCandle.value);
    });

    return () => {
      unsubscribe();
      liveCandle.value = null;
    };
  }, [symbol, interval, liveCandle, processTrade]);

  return { liveCandle };
}
