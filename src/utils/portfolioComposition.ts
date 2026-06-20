import type { Holdings, HoldingPosition } from '../types';
import { compositionSliceColors } from '@/src/design-system/tokens/charts';
import {
  filterHoldingsByAccount,
  getAccountSelectionLabel,
  type PortfolioAccountSelection,
} from './portfolioAccountFilter';
import type { TFunction } from 'i18next';

export const COMPOSITION_SLICE_COLORS = compositionSliceColors;

export type CompositionSlice = {
  key: string;
  symbol: string;
  valueUsd: number;
  pct: number;
  color: string;
};

export type PortfolioComposition = {
  slices: CompositionSlice[];
  totalUsd: number;
  scopeLabel: string;
  positionCount: number;
};

const MAX_SUMMARY_SLICES = 5;

function mergePositionsBySymbol(positions: HoldingPosition[]): Map<string, number> {
  const bySymbol = new Map<string, number>();
  for (const p of positions) {
    const symbol = (p.symbol ?? '').trim().toUpperCase();
    const value = p.value ?? 0;
    if (!symbol || !Number.isFinite(value) || value <= 0) continue;
    bySymbol.set(symbol, (bySymbol.get(symbol) ?? 0) + value);
  }
  return bySymbol;
}

function toSlices(
  entries: { symbol: string; valueUsd: number }[],
  totalUsd: number,
  maxSlices: number | null
): CompositionSlice[] {
  const sorted = [...entries].sort((a, b) => b.valueUsd - a.valueUsd);
  const limit = maxSlices ?? sorted.length;
  const primary = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const otherValue = rest.reduce((sum, e) => sum + e.valueUsd, 0);

  const rows = [...primary];
  if (otherValue > 0) {
    rows.push({ symbol: 'OTHER', valueUsd: otherValue });
  }

  return rows.map((row, index) => ({
    key: row.symbol === 'OTHER' ? 'other' : row.symbol,
    symbol: row.symbol,
    valueUsd: row.valueUsd,
    pct: totalUsd > 0 ? (row.valueUsd / totalUsd) * 100 : 0,
    color: COMPOSITION_SLICE_COLORS[index % COMPOSITION_SLICE_COLORS.length],
  }));
}

export function buildPortfolioComposition(
  holdings: Holdings | null,
  selection: PortfolioAccountSelection,
  t: TFunction,
  wallets: Parameters<typeof getAccountSelectionLabel>[2],
  exchanges: Parameters<typeof getAccountSelectionLabel>[3],
  options?: { maxSlices?: number | null }
): PortfolioComposition | null {
  if (!holdings) return null;

  const view = filterHoldingsByAccount(holdings, selection);
  const totalUsd = view.displayTotal;
  if (!Number.isFinite(totalUsd) || totalUsd <= 0) return null;

  const bySymbol = mergePositionsBySymbol(view.positions);
  if (bySymbol.size === 0) return null;

  const entries = [...bySymbol.entries()].map(([symbol, valueUsd]) => ({ symbol, valueUsd }));
  const maxSlices = options?.maxSlices === undefined ? MAX_SUMMARY_SLICES : options.maxSlices;

  const slices = toSlices(entries, totalUsd, maxSlices).map((slice) =>
    slice.symbol === 'OTHER'
      ? { ...slice, symbol: t('portfolio.compositionOther') }
      : slice
  );

  return {
    slices,
    totalUsd,
    scopeLabel: getAccountSelectionLabel(selection, t, wallets, exchanges),
    positionCount: view.positions.filter((p) => (p.value ?? 0) > 0).length,
  };
}

export function formatCompositionPct(pct: number): string {
  if (pct >= 10) return `${pct.toFixed(0)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}

export function formatCompositionUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
