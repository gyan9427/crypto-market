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

export interface ChartDataPoint {
  value: number;
  dataPointText?: string;
  label?: string;
}

export type ChartVariant = 'line' | 'area';

export type KlineInterval = '1m' | '5m' | '1h' | '1d';

export interface KlinesParams {
  symbol: string;
  interval: KlineInterval;
  from?: string;
  to?: string;
  exchange?: string;
  limit?: number;
}
