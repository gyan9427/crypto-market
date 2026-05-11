import { useEffect, useRef, useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { KlineRecord, TradeRecord, KlineInterval } from '../types';
import { fetchTrades, fetchKlines } from '../services/chartApi';
import { MarketWebSocketManager } from '../services/MarketWebSocketManager';
import { INTERVAL_MS } from '../constants';

export interface UseRealtimeCandleParams {
  symbol: string;
  interval: KlineInterval;
  lastCandle: KlineRecord | null;
  onNewCandle?: (candle: KlineRecord) => void;
  /** Called with gap-fill candles fetched after a WebSocket reconnect */
  onGapFill?: (candles: KlineRecord[]) => void;
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
  const { symbol, interval, lastCandle, onNewCandle, onGapFill } = params;
  const liveCandle = useSharedValue<KlineRecord | null>(null);
  const lastCandleRef = useRef<KlineRecord | null>(lastCandle);
  const onNewCandleRef = useRef(onNewCandle);
  const onGapFillRef = useRef(onGapFill);

  lastCandleRef.current = lastCandle;
  onNewCandleRef.current = onNewCandle;
  onGapFillRef.current = onGapFill;

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

    const unsubscribe = MarketWebSocketManager.subscribe(
      symbol,
      interval,
      (trade) => {
        liveCandle.value = processTrade(trade, liveCandle.value);
      },
      {
        // Issue 13: on reconnect, fetch the candles that arrived during the gap
        onReconnect: (gapStartMs) => {
          fetchKlines({
            symbol,
            interval,
            from: new Date(gapStartMs).toISOString(),
            to: new Date(Date.now()).toISOString(),
            limit: 500,
          })
            .then((gapCandles) => {
              if (gapCandles.length > 0) {
                onGapFillRef.current?.(gapCandles);
              }
            })
            .catch(() => {
              // gap-fill failure is non-fatal; chart will be slightly stale until next reload
            });
        },
      }
    );

    return () => {
      unsubscribe();
      liveCandle.value = null;
    };
  }, [symbol, interval, liveCandle, processTrade]);

  return { liveCandle };
}
