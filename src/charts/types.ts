export interface KlineRecord {
  openTime: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  tradeCount?: number;
}

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

export type KlineInterval = '1m' | '5m' | '1h' | '1d' | '1w';

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
export interface LiveCandle extends KlineRecord {
  openTime: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount?: number;
}
