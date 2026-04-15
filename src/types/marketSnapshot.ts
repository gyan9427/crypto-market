/**
 * Mirrors backend `MarketSnapshotV2` (GET /api/market/snapshot).
 */

export type SparklineInterval = '1h' | '4h' | '1d';

export type SparklinePayload =
  | { encoding: 'closes'; values: number[] }
  | { encoding: 'flat'; value: number };

export interface SnapshotRow {
  coinId: string;
  symbol: string;
  baseAsset: string;
  name: string;
  rank?: number;
  image?: string;
  price: number;
  percentChange24h: number;
  volume24h: number;
  marketCap?: number;
  sparkline: SparklinePayload;
  sparklineInterval: SparklineInterval;
  priceTimestamp?: string;
}

export interface MarketSnapshotV2 {
  version: 2;
  snapshotGeneratedAt: string;
  etag: string;
  snapshotRevision: number;
  tabs: {
    trending: SnapshotRow[];
    topGainers: SnapshotRow[];
    topLosers: SnapshotRow[];
  };
}
