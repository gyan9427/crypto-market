export type PortfolioContextDto = {
  schemaVersion: number;
  userId: string;
  heldSymbols: string[];
  heldCoinIds: string[];
  weightBySymbol: Record<string, number>;
  ingestRevision: number;
  analyticsRevision: number;
  stale: boolean;
  staleMapping: boolean;
  narrativeVector?: Record<string, number>;
  convictionVector?: Record<string, number>;
  topThemes?: string[];
  healthScore?: number | null;
  identityId?: string;
  partial?: boolean;
};

type ContextCacheEntry = {
  tokenKey: string;
  data: PortfolioContextDto | null;
  expires: number;
};

let contextCache: ContextCacheEntry | null = null;

export function readPortfolioContextCache(
  tokenKey: string,
  now = Date.now()
): PortfolioContextDto | null | undefined {
  if (contextCache && contextCache.tokenKey === tokenKey && contextCache.expires > now) {
    return contextCache.data;
  }
  return undefined;
}

export function writePortfolioContextCache(
  tokenKey: string,
  data: PortfolioContextDto | null,
  expires: number
): void {
  contextCache = { tokenKey, data, expires };
}

export function clearPortfolioContextCache(): void {
  contextCache = null;
}

export function invalidatePortfolioContextCache(): void {
  contextCache = null;
}
