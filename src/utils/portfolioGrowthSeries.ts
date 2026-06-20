import type { Holdings } from '../types';
import type { PortfolioEvolutionPoint } from '@/src/services/portfolioIntelligenceApi';
import {
  filterHoldingsByAccount,
  type PortfolioAccountSelection,
} from './portfolioAccountFilter';

export type GrowthPeriod = '24h' | '1W' | '1M' | '1Y' | 'all';

export const GROWTH_PERIODS: GrowthPeriod[] = ['24h', '1W', '1M', '1Y', 'all'];

const PERIOD_MS: Record<Exclude<GrowthPeriod, 'all'>, number> = {
  '24h': 24 * 3_600_000,
  '1W': 7 * 86_400_000,
  '1M': 30 * 86_400_000,
  '1Y': 365 * 86_400_000,
};

export type PortfolioGrowthPoint = {
  asOf: string;
  valueUsd: number;
};

export type PortfolioGrowthSeries = {
  points: PortfolioGrowthPoint[];
  currentValue: number;
  periodChangePct: number;
  periodChangeUsd: number;
  hasHistory: boolean;
  approximated: boolean;
  windowStartMs: number;
  windowEndMs: number;
};

function periodCutoff(period: GrowthPeriod, now = Date.now()): number | null {
  if (period === 'all') return null;
  return now - PERIOD_MS[period];
}

export function growthChartTimeWindow(
  period: GrowthPeriod,
  points: PortfolioGrowthPoint[],
  now = Date.now()
): { minTime: number; maxTime: number } {
  const maxTime = now;
  if (period === 'all') {
    const dataMin =
      points.length > 0
        ? Math.min(...points.map((p) => new Date(p.asOf).getTime()))
        : maxTime - 90 * 86_400_000;
    return { minTime: Math.min(dataMin, maxTime - 90 * 86_400_000), maxTime };
  }
  return { minTime: maxTime - PERIOD_MS[period], maxTime };
}

function scopeShareRatio(holdings: Holdings, selection: PortfolioAccountSelection): number {
  const entireTotal = holdings.totalValue;
  if (!Number.isFinite(entireTotal) || entireTotal <= 0) return 1;
  const scoped = filterHoldingsByAccount(holdings, selection);
  return Math.min(Math.max(scoped.displayTotal / entireTotal, 0), 1);
}

function filterByPeriod(
  points: PortfolioGrowthPoint[],
  period: GrowthPeriod,
  now = Date.now()
): PortfolioGrowthPoint[] {
  const cutoff = periodCutoff(period, now);
  if (cutoff == null) return points;
  return points.filter((p) => new Date(p.asOf).getTime() >= cutoff);
}

function pointsTimeSpanMs(points: PortfolioGrowthPoint[]): number {
  if (points.length < 2) return 0;
  const times = points.map((p) => new Date(p.asOf).getTime());
  return Math.max(...times) - Math.min(...times);
}

function needsPeriodSynthesis(points: PortfolioGrowthPoint[], period: GrowthPeriod): boolean {
  if (points.length < 2) return true;
  const span = pointsTimeSpanMs(points);
  const minSpan = period === 'all' ? 2 * 86_400_000 : Math.min(PERIOD_MS[period] * 0.08, 86_400_000);
  return span < minSpan;
}

function changePctForPeriod(
  holdings: Holdings,
  period: GrowthPeriod,
  canUse24h: boolean
): number {
  if (!canUse24h) return 0;
  const dailyPct = holdings.relativeChange24h;
  if (!Number.isFinite(dailyPct)) return 0;

  switch (period) {
    case '24h':
      return dailyPct;
    case '1W':
      return (Math.pow(1 + dailyPct / 100, 7) - 1) * 100;
    case '1M':
      return (Math.pow(1 + dailyPct / 100, 30) - 1) * 100;
    case '1Y':
      return (Math.pow(1 + dailyPct / 100, 365) - 1) * 100;
    case 'all':
      return (Math.pow(1 + dailyPct / 100, 90) - 1) * 100;
    default:
      return dailyPct;
  }
}

function computePeriodChange(points: PortfolioGrowthPoint[]): {
  periodChangePct: number;
  periodChangeUsd: number;
} {
  if (points.length < 2) {
    return { periodChangePct: 0, periodChangeUsd: 0 };
  }
  const first = points[0].valueUsd;
  const last = points[points.length - 1].valueUsd;
  const periodChangeUsd = last - first;
  const periodChangePct = first > 0 ? (periodChangeUsd / first) * 100 : 0;
  return { periodChangePct, periodChangeUsd };
}

/** Evenly spaced synthetic series across the selected period window. */
function synthesizePeriodSeries(
  currentValue: number,
  changePct: number,
  period: GrowthPeriod,
  now = Date.now()
): PortfolioGrowthPoint[] {
  const { minTime, maxTime } = growthChartTimeWindow(period, [], now);
  const startValue =
    changePct !== 0 && Number.isFinite(changePct)
      ? currentValue / (1 + changePct / 100)
      : currentValue * 0.985;

  const steps = period === '24h' ? 8 : period === '1W' ? 7 : period === '1M' ? 10 : 12;
  const points: PortfolioGrowthPoint[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const frac = i / steps;
    const t = minTime + (maxTime - minTime) * frac;
    const valueUsd = startValue + (currentValue - startValue) * frac;
    points.push({ asOf: new Date(t).toISOString(), valueUsd });
  }

  points[points.length - 1] = { asOf: new Date(now).toISOString(), valueUsd: currentValue };
  return points;
}

function anchorSeriesToWindow(
  points: PortfolioGrowthPoint[],
  period: GrowthPeriod,
  currentValue: number,
  now = Date.now()
): PortfolioGrowthPoint[] {
  const { minTime, maxTime } = growthChartTimeWindow(period, points, now);
  const sorted = [...points].sort(
    (a, b) => new Date(a.asOf).getTime() - new Date(b.asOf).getTime()
  );

  const inWindow = sorted.filter((p) => {
    const t = new Date(p.asOf).getTime();
    return t >= minTime && t <= maxTime;
  });

  const seed = inWindow.length > 0 ? inWindow : sorted;
  const startValue = seed[0]?.valueUsd ?? currentValue;

  const anchored: PortfolioGrowthPoint[] = [
    { asOf: new Date(minTime).toISOString(), valueUsd: startValue },
    ...seed.filter((p) => new Date(p.asOf).getTime() > minTime),
  ];

  const last = anchored[anchored.length - 1];
  if (!last || Math.abs(last.valueUsd - currentValue) > 0.001) {
    anchored.push({ asOf: new Date(now).toISOString(), valueUsd: currentValue });
  } else {
    anchored[anchored.length - 1] = { asOf: new Date(now).toISOString(), valueUsd: currentValue };
  }

  return anchored;
}

/**
 * Builds a scoped value-over-time series for the selected portfolio account.
 */
export function buildPortfolioGrowthSeries(params: {
  evolution: PortfolioEvolutionPoint[];
  holdings: Holdings | null;
  selection: PortfolioAccountSelection;
  period: GrowthPeriod;
}): PortfolioGrowthSeries | null {
  const { evolution, holdings, selection, period } = params;
  if (!holdings) return null;

  const now = Date.now();
  const scopedView = filterHoldingsByAccount(holdings, selection);
  const currentValue = scopedView.displayTotal;
  if (!Number.isFinite(currentValue) || currentValue < 0) return null;

  const share = selection.kind === 'entire_portfolio' ? 1 : scopeShareRatio(holdings, selection);
  const approximated = selection.kind !== 'entire_portfolio';
  const canUse24h = selection.kind === 'entire_portfolio' && scopedView.showCombined24h;

  const evolutionPoints: PortfolioGrowthPoint[] = evolution
    .map((p) => ({
      asOf: p.asOf,
      valueUsd: p.totalValueUsd * share,
    }))
    .filter((p) => Number.isFinite(p.valueUsd) && p.valueUsd >= 0)
    .sort((a, b) => new Date(a.asOf).getTime() - new Date(b.asOf).getTime());

  let filtered = filterByPeriod(evolutionPoints, period, now);
  let hasHistory = evolutionPoints.length >= 2 && !needsPeriodSynthesis(filtered, period);

  if (!hasHistory || needsPeriodSynthesis(filtered, period)) {
    const changePct = changePctForPeriod(holdings, period, canUse24h);
    filtered = synthesizePeriodSeries(currentValue, changePct, period, now);
    hasHistory = false;
  } else {
    filtered = anchorSeriesToWindow(filtered, period, currentValue, now);
  }

  const { minTime: windowStartMs, maxTime: windowEndMs } = growthChartTimeWindow(
    period,
    filtered,
    now
  );
  const { periodChangePct, periodChangeUsd } = computePeriodChange(filtered);

  return {
    points: filtered,
    currentValue,
    periodChangePct,
    periodChangeUsd,
    hasHistory,
    approximated: approximated || !hasHistory,
    windowStartMs,
    windowEndMs,
  };
}

export function formatGrowthAxisValue(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(value >= 100 ? 0 : 2)}`;
}

export function formatGrowthAxisTime(iso: string, period: GrowthPeriod): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  switch (period) {
    case '24h':
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    case '1W':
      return d.toLocaleDateString(undefined, { weekday: 'short' });
    case '1Y':
    case 'all':
      return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    case '1M':
    default:
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

export function evolutionFetchDaysForPeriod(_period: GrowthPeriod): 90 {
  return 90;
}
