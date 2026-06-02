import type { ThemeTokens } from '@/src/theme/theme';

export type TradeColors = {
  green: string;
  red: string;
  accent: string;
};

export function getTradeColors(tokens: ThemeTokens): TradeColors {
  return {
    green: tokens.chart.bull,
    red: tokens.chart.bear,
    accent: tokens.chart.line,
  };
}
