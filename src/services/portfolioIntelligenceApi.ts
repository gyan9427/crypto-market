import { API_BASE_URL } from '@/src/services/apiBase';
import { apiRequest } from '@/src/services/api';
import { getAuthToken } from '@/src/services/authSession';
import {
  clearPortfolioContextCache,
  readPortfolioContextCache,
  writePortfolioContextCache,
  type PortfolioContextDto,
} from '@/src/services/portfolioContextCache';
import {
  cacheKeyForToken,
  clearPortfolioAnalyticsCache,
  defaultAnalyticsExpiry,
  readPortfolioAnalyticsCache,
  writePortfolioAnalyticsCache,
} from '@/src/services/portfolioAnalyticsCache';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';
import { fetchWithTimeout } from '@/src/runtime/asyncRequestGuard';

export type { PortfolioContextDto } from '@/src/services/portfolioContextCache';

export type PortfolioIdentityDto = {
  id: string;
  name: string;
  confidence: number;
};

export type PortfolioSummaryDto = {
  healthScore: number | null;
  healthLabel: string;
  riskScore: number;
  riskLabel: string;
  identity: PortfolioIdentityDto;
  topCategory: { id: string; name: string; pct: number };
  partial: boolean;
  analyticsRevision: number;
  formulaBundle?: Record<string, string>;
};

export type PiInsight = {
  id: string;
  templateId: string;
  type: string;
  severity: string;
  priority: number;
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
  confidence: number;
  modelVersion: string;
};

export type PortfolioInsightsResponse = {
  insights: PiInsight[];
  partial?: boolean;
};

export type PortfolioAnalyticsPayload = {
  schemaVersion: number;
  computedAt: string;
  partial: boolean;
  allocation: {
    byCategory: Record<string, number>;
    topCategory: { id: string; name: string; pct: number };
    categoryCount: number;
  };
  risk: {
    riskScore: number;
    riskLabel: string;
  };
  narrative: {
    vector: Record<string, number>;
    dominant: { id: string; name: string; pct: number };
    ranked: { id: string; name: string; pct: number }[];
  };
  concentration: {
    topHolding: string;
    topHoldingPct: number;
    top3Pct: number;
    concentrationLevel: string;
    hhi: number;
  };
  diversification: {
    score: number;
    label: string;
    effectiveCategories: number;
  };
  stablecoin: {
    stablecoinPct: number;
    bufferClass: string;
    pullbackReadiness: string;
  };
  health: {
    healthScore: number | null;
    healthLabel: string;
    breakdown: {
      risk: number;
      diversification: number;
      concentration: number;
      stablecoin: number;
    };
  };
  identity: {
    primary: PortfolioIdentityDto;
    secondary?: PortfolioIdentityDto;
    signals: Record<string, number>;
  };
  insights: PiInsight[];
  telemetry: {
    eligiblePositionCount: number;
    excludedLowConfidenceCount: number;
    mappingCoveragePct: number;
  };
  confidence?: {
    portfolio: number;
    analytics: number;
    identity: number;
    risk: number;
    portfolioUnit?: number;
  };
  opportunities?: {
    id: string;
    type: string;
    priority: number;
    title: string;
    summary: string;
    evidence: Record<string, unknown>;
    confidence: number;
    goalAdapted: boolean;
  }[];
};

export type PortfolioEvolutionPoint = {
  asOf: string;
  totalValueUsd: number;
  allocationByCategory: Record<string, number>;
  healthScore?: number | null;
};

export type PortfolioEvolutionResponse = {
  points: PortfolioEvolutionPoint[];
  granularity: 'daily' | 'delta';
};

export type PortfolioConfidenceDto = NonNullable<PortfolioAnalyticsPayload['confidence']>;

export type PortfolioOpportunitiesResponse = {
  opportunities: NonNullable<PortfolioAnalyticsPayload['opportunities']>;
};

export type GoalProfileId =
  | 'capital_preservation'
  | 'balanced_growth'
  | 'aggressive_growth'
  | 'yield_generation'
  | 'narrative_investing';

export type PortfolioGoalDto = {
  goalProfileId: GoalProfileId;
  setAt: string;
  source: 'onboarding' | 'settings' | 'inferred';
  definition: {
    name: string;
    targetBands: Record<string, { min: number; max: number }>;
    healthWeights: Record<string, number>;
  };
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = getAuthToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function piGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T | null> {
  try {
    return await apiRequest<T>(path, { signal: options?.signal });
  } catch {
    return null;
  }
}

export async function fetchPortfolioContext(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioContextDto | null> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const res = await fetchWithTimeout(`${base}/portfolio/intelligence/context`, {
    headers: await authHeaders(),
    signal: options?.signal,
    timeoutMs: 8_000,
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function fetchPortfolioContextCached(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioContextDto | null> {
  const tokenKey = cacheKeyForToken();
  const now = Date.now();
  const cached = readPortfolioContextCache(tokenKey, now);
  if (cached !== undefined) {
    return cached;
  }
  incrementPerfCounter('piFetch');
  const data = await fetchPortfolioContext(options);
  writePortfolioContextCache(tokenKey, data, now + 30_000);
  return data;
}

export async function fetchPortfolioSummary(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioSummaryDto | null> {
  return piGet<PortfolioSummaryDto>('/portfolio/intelligence/summary', options);
}

export async function fetchPortfolioAnalytics(options?: {
  signal?: AbortSignal;
  force?: boolean;
}): Promise<PortfolioAnalyticsPayload | null> {
  const tokenKey = cacheKeyForToken();
  const now = Date.now();
  if (!options?.force) {
    const cached = readPortfolioAnalyticsCache(tokenKey, now);
    if (cached !== undefined) return cached as PortfolioAnalyticsPayload | null;
  }

  incrementPerfCounter('piAnalyticsFetch');
  const res = await piGet<{ manifest: unknown; payload: PortfolioAnalyticsPayload }>(
    '/portfolio/intelligence/snapshot/latest',
    options
  );
  const data = res?.payload ?? null;
  writePortfolioAnalyticsCache(tokenKey, data, defaultAnalyticsExpiry(now));
  return data;
}

export async function fetchPortfolioInsights(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioInsightsResponse | null> {
  return piGet<PortfolioInsightsResponse>('/portfolio/intelligence/insights', options);
}

export async function fetchPortfolioEvolution(
  days: 30 | 90 = 30,
  options?: { signal?: AbortSignal }
): Promise<PortfolioEvolutionResponse | null> {
  return piGet<PortfolioEvolutionResponse>(
    `/portfolio/intelligence/evolution?days=${days}`,
    options
  );
}

export async function fetchPortfolioConfidence(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioConfidenceDto | null> {
  return piGet<PortfolioConfidenceDto>('/portfolio/intelligence/confidence', options);
}

export async function fetchPortfolioOpportunities(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioOpportunitiesResponse | null> {
  return piGet<PortfolioOpportunitiesResponse>('/portfolio/intelligence/opportunities', options);
}

export async function fetchPortfolioGoal(options?: {
  signal?: AbortSignal;
}): Promise<PortfolioGoalDto | null> {
  return piGet<PortfolioGoalDto>('/portfolio/intelligence/goal', options);
}

export async function setPortfolioGoal(
  goalProfileId: GoalProfileId,
  options?: { signal?: AbortSignal }
): Promise<{ goalProfileId: GoalProfileId; enqueued: boolean } | null> {
  try {
    return await apiRequest<{ goalProfileId: GoalProfileId; enqueued: boolean }>(
      '/portfolio/intelligence/goal',
      {
        method: 'PUT',
        body: JSON.stringify({ goalProfileId }),
        signal: options?.signal,
      }
    );
  } catch {
    return null;
  }
}

export async function requestPortfolioRecompute(options?: {
  signal?: AbortSignal;
}): Promise<boolean> {
  try {
    const res = await apiRequest<{ enqueued: boolean }>('/portfolio/intelligence/recompute', {
      method: 'POST',
      signal: options?.signal,
    });
    return !!res.enqueued;
  } catch {
    return false;
  }
}

/** Called when WS `analytics_revision` arrives — bust PI caches and optionally refetch. */
export function invalidatePortfolioIntelligenceCache(opts?: { refetch?: boolean }): void {
  clearPortfolioContextCache();
  clearPortfolioAnalyticsCache();
  if (opts?.refetch) {
    void fetchPortfolioContextCached();
  }
}

export type AiChatResponse = {
  sessionId: string;
  blocked?: boolean;
  reason?: string;
  response?: string;
  citations?: { sourceType: string; sourceId: string; templateId?: string }[];
  portfolioConfidence?: number;
};

export async function chatWithPortfolioAnalyst(
  message: string,
  sessionId?: string
): Promise<AiChatResponse | null> {
  try {
    return await apiRequest<AiChatResponse>('/portfolio/intelligence/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  } catch {
    return null;
  }
}

export type SimulationResult = {
  simulationId: string;
  scenario: string;
  health: { healthScore: number | null; healthLabel: string };
  risk: { riskScore: number; riskLabel: string };
  disclaimer: string;
};

export async function simulatePortfolioWhatIf(params: {
  label?: string;
  adjustments: {
    action?: string;
    symbol?: string;
    deltaPct?: number;
  }[];
}): Promise<SimulationResult | null> {
  try {
    return await apiRequest<SimulationResult>('/portfolio/intelligence/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch {
    return null;
  }
}

export { clearPortfolioContextCache } from '@/src/services/portfolioContextCache';
export { clearPortfolioAnalyticsCache } from '@/src/services/portfolioAnalyticsCache';
