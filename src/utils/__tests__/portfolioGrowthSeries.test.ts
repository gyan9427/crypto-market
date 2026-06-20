import { describe, expect, it } from 'vitest';
import type { Holdings } from '@/src/types';
import type { PortfolioEvolutionPoint } from '@/src/services/portfolioIntelligenceApi';
import {
  buildPortfolioGrowthSeries,
  growthChartTimeWindow,
} from '../portfolioGrowthSeries';

const holdings: Holdings = {
  totalValue: 100,
  absoluteChange24h: 6,
  relativeChange24h: 6,
  positions: [
    {
      name: 'Polygon',
      symbol: 'POL',
      quantity: 100,
      value: 60,
      chain: 'polygon',
      source: 'wallet',
      sourceConnectionId: 'wallet-a',
    },
    {
      name: 'BTC',
      symbol: 'BTC',
      quantity: 0.01,
      value: 40,
      chain: 'coindcx',
      source: 'exchange',
      venue: 'coindcx',
      sourceConnectionId: 'ex-1',
    },
  ],
};

const evolution: PortfolioEvolutionPoint[] = [
  { asOf: '2026-06-10T00:00:00.000Z', totalValueUsd: 80, allocationByCategory: {} },
  { asOf: '2026-06-15T00:00:00.000Z', totalValueUsd: 90, allocationByCategory: {} },
  { asOf: '2026-06-19T00:00:00.000Z', totalValueUsd: 95, allocationByCategory: {} },
];

describe('buildPortfolioGrowthSeries', () => {
  it('uses full evolution for entire portfolio', () => {
    const series = buildPortfolioGrowthSeries({
      evolution,
      holdings,
      selection: { kind: 'entire_portfolio' },
      period: '1M',
    });
    expect(series).not.toBeNull();
    expect(series!.currentValue).toBe(100);
    expect(series!.points.length).toBeGreaterThanOrEqual(2);
    expect(series!.windowEndMs).toBeGreaterThan(series!.windowStartMs);
  });

  it('scales evolution for single wallet scope', () => {
    const series = buildPortfolioGrowthSeries({
      evolution,
      holdings,
      selection: { kind: 'wallet', id: 'wallet-a', address: '0xabc' },
      period: '1M',
    });
    expect(series).not.toBeNull();
    expect(series!.approximated).toBe(true);
    expect(series!.currentValue).toBe(60);
  });

  it('uses distinct time windows per period', () => {
    const base = {
      evolution: [],
      holdings: {
        ...holdings,
        totalValue: 50,
        relativeChange24h: 2,
        positions: holdings.positions.slice(0, 1),
      },
      selection: { kind: 'entire_portfolio' as const },
    };

    const day = buildPortfolioGrowthSeries({ ...base, period: '24h' });
    const month = buildPortfolioGrowthSeries({ ...base, period: '1M' });

    expect(day!.windowEndMs - day!.windowStartMs).toBeLessThan(
      month!.windowEndMs - month!.windowStartMs
    );
  });

  it('growthChartTimeWindow spans full period', () => {
    const now = Date.parse('2026-06-20T12:00:00.000Z');
    const { minTime, maxTime } = growthChartTimeWindow('1W', [], now);
    expect(maxTime - minTime).toBe(7 * 86_400_000);
  });
});
