import type { ThemeTokens } from './theme';

/**
 * Skia chart layers read colors via ChartUiContext (see src/charts/ChartUiContext.tsx).
 * Values are chosen for contrast on both dark and light chart surfaces.
 */
export type ChartUIPalette = {
  grid: string;
  gridFaint: string;
  reference: string;
  separator: string;
  crosshair: string;
  tooltipBg: string;
  tooltipTextPrimary: string;
  tooltipTextSecondary: string;
  axisLabel: string;
  linePositive: string;
  lineNegative: string;
  positiveSubtle: string;
  negativeSubtle: string;
};

/** Portfolio / market accent used across holdings and intelligence UI. */
export const MARKET_ACCENT = '#6383ff';

export type MarketUiPalette = {
  accent: string;
  accentBg: string;
  accentBgStrong: string;
  accentBorder: string;
  cardBg: string;
  rowBg: string;
  panelBg: string;
  chipMutedBg: string;
  periodChipBg: string;
  dotInactive: string;
  warningBannerBg: string;
  warningBannerBorder: string;
  returnToLiveBg: string;
  returnToLiveBorder: string;
};

export function getMarketUiPalette(tokens: ThemeTokens): MarketUiPalette {
  return {
    accent: MARKET_ACCENT,
    accentBg: tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)',
    accentBgStrong: tokens.isDark ? 'rgba(99,131,255,0.35)' : 'rgba(99,131,255,0.45)',
    accentBorder: tokens.isDark ? 'rgba(99,131,255,0.4)' : 'rgba(99,131,255,0.35)',
    cardBg: tokens.isDark ? tokens.surfaceMuted : tokens.surface,
    rowBg: tokens.bg,
    panelBg: tokens.surface,
    chipMutedBg: tokens.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    periodChipBg: tokens.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    dotInactive: tokens.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
    warningBannerBg: tokens.isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.1)',
    warningBannerBorder: tokens.isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.25)',
    returnToLiveBg: tokens.isDark ? 'rgba(22,22,28,0.92)' : 'rgba(250,250,252,0.96)',
    returnToLiveBorder: tokens.isDark ? 'rgba(99,131,255,0.35)' : 'rgba(99,131,255,0.45)',
  };
}

export function healthScoreColor(score: number | null | undefined, tokens: ThemeTokens): string {
  if (score == null || !Number.isFinite(score)) return tokens.textMuted;
  if (score >= 70) return tokens.colors.success[500];
  if (score >= 40) return tokens.colors.amber;
  return tokens.colors.error[500];
}

export function severityColor(severity: string, tokens: ThemeTokens): string {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return tokens.colors.error[500];
  if (s === 'medium' || s === 'moderate') return tokens.colors.amber;
  if (s === 'low' || s === 'info') return MARKET_ACCENT;
  return tokens.textMuted;
}

export function getChartUIPalette(tokens: ThemeTokens): ChartUIPalette {
  const c = tokens.colors;
  const isDark = tokens.isDark;

  if (isDark) {
    return {
      grid: 'rgba(255,255,255,0.06)',
      gridFaint: 'rgba(255,255,255,0.04)',
      reference: 'rgba(255,255,255,0.18)',
      separator: 'rgba(255,255,255,0.08)',
      crosshair: 'rgba(255,255,255,0.38)',
      tooltipBg: tokens.surfaceMuted,
      tooltipTextPrimary: tokens.textStrong,
      tooltipTextSecondary: tokens.textMuted,
      axisLabel: tokens.textMuted,
      linePositive: c.success[500],
      lineNegative: c.error[500],
      positiveSubtle: 'rgba(34,197,94,0.20)',
      negativeSubtle: 'rgba(239,68,68,0.20)',
    };
  }

  return {
    grid: 'rgba(0,0,0,0.08)',
    gridFaint: 'rgba(0,0,0,0.04)',
    reference: 'rgba(0,0,0,0.14)',
    separator: 'rgba(0,0,0,0.10)',
    crosshair: 'rgba(0,0,0,0.35)',
    tooltipBg: tokens.surfaceMuted,
    tooltipTextPrimary: tokens.textStrong,
    tooltipTextSecondary: tokens.textMuted,
    axisLabel: tokens.textMuted,
    linePositive: c.success[600],
    lineNegative: c.error[600],
    positiveSubtle: 'rgba(22,163,74,0.16)',
    negativeSubtle: 'rgba(220,38,38,0.16)',
  };
}
