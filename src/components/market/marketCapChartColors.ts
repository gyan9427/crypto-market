import type { ThemeTokens } from '@/src/theme/theme';
import { getChartUIPalette } from '@/src/theme/chartPalette';

export type MarketCapChartColors = {
  line: string;
  green: string;
  red: string;
  crosshair: string;
  marker: string;
  grid: string;
};

export function getMarketCapChartColors(tokens: ThemeTokens): MarketCapChartColors {
  const ui = getChartUIPalette(tokens);
  return {
    line: tokens.chart.line,
    green: tokens.chart.bull,
    red: tokens.chart.bear,
    crosshair: ui.reference,
    marker: tokens.isDark ? tokens.textStrong : tokens.surface,
    grid: ui.separator,
  };
}
