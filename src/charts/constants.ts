import type { KlineInterval } from '@/src/types/kline';

/** Right margin for Y-axis price labels (px) */
export const PRICE_AXIS_WIDTH = 64;

/** Bottom margin for time axis (px) */
export const TIME_AXIS_HEIGHT = 24;

/** Fraction of chart height allocated to volume bars */
export const VOLUME_RATIO = 0.22;

/** Default candle width in pixels */
export const BASE_CANDLE_WIDTH = 8;

/** Minimum candle width when zoomed out */
export const MIN_CANDLE_WIDTH = 2;

/** Maximum candle width when zoomed in */
export const MAX_CANDLE_WIDTH = 40;

/** Body width relative to slot width (0.75 = 75%) */
export const CANDLE_BODY_RATIO = 0.75;

/** Interval duration in milliseconds for candle boundary detection */
export const INTERVAL_MS: Record<KlineInterval, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
  '1w': 604_800_000,
};
