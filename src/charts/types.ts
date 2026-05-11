import type { KlineRecord, KlineInterval } from '@/src/types/kline';

export type { KlineRecord, KlineInterval };

export interface TradeRecord {
  time: Date | string;
  price: number;
  quantity: number;
  quoteQuantity?: number;
  tradeId: number | string;
  isBuyerMaker?: boolean;
}

export interface ChartCrosshairPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartDataPoint {
  value: number;
  dataPointText?: string;
  label?: string;
}

export type ChartVariant = 'line' | 'area';

export interface KlinesParams {
  symbol: string;
  interval: KlineInterval;
  from?: string;
  to?: string;
  exchange?: string;
  limit?: number;
}

/** Pre-computed canvas positions for one candle (used in Skia rendering) */
export interface SkiaCandleData {
  x: number;
  wickTop: number;
  wickBottom: number;
  bodyTop: number;
  bodyBottom: number;
  bodyWidth: number;
  isBull: boolean;
}

/** Viewport state for zoom/pan */
export interface ChartViewState {
  candleWidthPx: number;
  offsetPx: number;
  visibleCount: number;
}

/** Partial candle built from real-time trade ticks */
export type LiveCandle = KlineRecord;
