export type RiskMeta = {
  revision: number;
  buildId: string;
  buildFingerprint: string;
  computedAt: string | null;
  stale: boolean;
  partial: boolean;
};

export type RiskCoinDto = {
  symbol: string;
  crs: number;
  rank: number;
  percentile: number;
  confidence: number;
  regime: string;
};

export type RiskRevisionMessage = {
  channel: 'risk';
  type: 'risk:revision';
  payload: {
    revision: number;
    buildId: string;
    computedAt: string;
    shardCount?: number;
  };
};
