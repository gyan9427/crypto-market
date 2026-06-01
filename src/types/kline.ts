/** Supported kline intervals — includes the missing 15m and 4h */
export type KlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

/** Single OHLCV candle. openTime is always Unix milliseconds. */
export interface KlineRecord {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  tradeCount?: number;
}
