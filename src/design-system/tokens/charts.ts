import type { ThemeTokens } from '../theme/types';

export type ChartColorTokens = {
  bull: string;
  bear: string;
  line: string;
  lineMuted: string;
};

export function getChartColorTokens(tokens: ThemeTokens): ChartColorTokens {
  const c = tokens.colors;
  return {
    bull: c.success[500],
    bear: c.danger[500],
    line: tokens.isDark ? '#6383ff' : c.primary[500],
    lineMuted: tokens.textMuted,
  };
}
