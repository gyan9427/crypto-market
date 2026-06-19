import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMarketTrend, fetchMarketTrendOHLC } from '../services/api';
import type { KlineInterval, KlineRecord } from '@/src/types/kline';
import { usePollingEffect } from './usePollingEffect';

export interface MarketOverviewData {
  klines: KlineRecord[];
  totalMarketCap: number;
  absoluteChange24h: number;
  relativeChange24h: number;
  high24h: number;
  low24h: number;
}

interface LiveMarketOverviewOptions {
  enabled?: boolean;
  intervalMs?: number;
  interval?: KlineInterval;
  limit?: number;
  /** 'line' uses scalar market-trend; 'candle' uses dedicated OHLC endpoint. */
  dataMode?: 'line' | 'candle';
}

const EMPTY_DATA: MarketOverviewData = {
  klines: [],
  totalMarketCap: 0,
  absoluteChange24h: 0,
  relativeChange24h: 0,
  high24h: 0,
  low24h: 0,
};

interface State {
  data: MarketOverviewData;
  hasFetched: boolean;
}

const INITIAL_STATE: State = { data: EMPTY_DATA, hasFetched: false };

export function useLiveMarketOverview(
  options: LiveMarketOverviewOptions = {}
): { data: MarketOverviewData; hasFetched: boolean } {
  const {
    enabled = true,
    intervalMs = 12_000,
    interval = '1m',
    limit = 240,
    dataMode = 'line',
  } = options;

  const [state, setState] = useState<State>(INITIAL_STATE);

  const prevKlinesRef = useRef<KlineRecord[]>([]);
  const prevLatestRef = useRef<number>(0);

  const intervalRef = useRef(interval);
  const limitRef = useRef(limit);
  const dataModeRef = useRef(dataMode);
  intervalRef.current = interval;
  limitRef.current = limit;
  dataModeRef.current = dataMode;

  useEffect(() => {
    setState(INITIAL_STATE);
    prevKlinesRef.current = [];
    prevLatestRef.current = 0;
  }, [interval, limit, dataMode]);

  const poll = useCallback(async () => {
    try {
      const mode = dataModeRef.current;

      if (mode === 'candle') {
        const trend = await fetchMarketTrendOHLC(intervalRef.current, limitRef.current, {
          cacheTtlMs: 10_000,
        });

        const isDegraded = trend.points.length === 0 || !(trend.latestValue > 0);
        if (isDegraded) {
          setState((prev) =>
            prev.hasFetched ? prev : { ...prev, hasFetched: true }
          );
          return;
        }

        const sameLength = trend.points.length === prevKlinesRef.current.length;
        const sameLatest = trend.latestValue === prevLatestRef.current;
        if (sameLength && sameLatest) return;

        const highs = trend.points.map((p) => p.high);
        const lows = trend.points.map((p) => p.low);
        const high24h = highs.length ? Math.max(...highs) : 0;
        const low24h = lows.length ? Math.min(...lows) : 0;

        const newKlines: KlineRecord[] = trend.points.map((point) => ({
          openTime:
            typeof point.openTime === 'number'
              ? point.openTime
              : new Date(point.openTime).getTime(),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: 0,
        }));

        prevKlinesRef.current = newKlines;
        prevLatestRef.current = trend.latestValue;

        setState({
          hasFetched: true,
          data: {
            klines: newKlines,
            totalMarketCap: trend.latestValue,
            absoluteChange24h: trend.absoluteChange24h,
            relativeChange24h: trend.relativeChange24h,
            high24h,
            low24h,
          },
        });
        return;
      }

      const trend = await fetchMarketTrend(intervalRef.current, limitRef.current, { cacheTtlMs: 10_000 });

      const isDegraded = trend.points.length === 0 || !(trend.latestValue > 0);
      if (isDegraded) {
        setState((prev) =>
          prev.hasFetched ? prev : { ...prev, hasFetched: true }
        );
        return;
      }

      const sameLength = trend.points.length === prevKlinesRef.current.length;
      const sameLatest = trend.latestValue === prevLatestRef.current;

      if (sameLength && sameLatest) return;

      const values = trend.points.map((p) => p.value);
      const high24h = values.length ? Math.max(...values) : 0;
      const low24h = values.length ? Math.min(...values) : 0;

      const newKlines: KlineRecord[] = trend.points.map((point) => ({
        openTime:
          typeof point.openTime === 'number'
            ? point.openTime
            : new Date(point.openTime).getTime(),
        open: point.value,
        high: point.value,
        low: point.value,
        close: point.value,
        volume: 0,
      }));

      prevKlinesRef.current = newKlines;
      prevLatestRef.current = trend.latestValue;

      setState({
        hasFetched: true,
        data: {
          klines: newKlines,
          totalMarketCap: trend.latestValue,
          absoluteChange24h: trend.absoluteChange24h,
          relativeChange24h: trend.relativeChange24h,
          high24h,
          low24h,
        },
      });
    } catch {
      setState((prev) =>
        prev.hasFetched ? prev : { ...prev, hasFetched: true }
      );
    }
  }, []);

  usePollingEffect(poll, [enabled, interval, limit, dataMode], {
    enabled,
    intervalMs,
    immediate: true,
  });

  return state;
}
