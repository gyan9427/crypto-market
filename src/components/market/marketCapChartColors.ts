import type { ThemeTokens } from '@/src/theme/theme';

export type MarketCapChartColors = {
  line: string;
  green: string;
  red: string;
};

export function getMarketCapChartColors(tokens: ThemeTokens): MarketCapChartColors {
  return {
    line: tokens.chart.line,
    green: tokens.chart.bull,
    red: tokens.chart.bear,
  };
}
