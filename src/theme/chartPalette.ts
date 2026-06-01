import type { ThemeTokens } from './theme';

/**
 * Skia chart layers read colors via ChartUiContext (see src/charts/ChartUiContext.tsx).
 * Values are chosen for contrast on both dark and light chart surfaces.
 */
export type ChartUIPalette = {
  grid: string;
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

export function getChartUIPalette(tokens: ThemeTokens): ChartUIPalette {
  const c = tokens.colors;
  const isDark = tokens.isDark;

  if (isDark) {
    return {
      grid: 'rgba(255,255,255,0.06)',
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
