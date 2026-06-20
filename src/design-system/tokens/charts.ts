import type { ThemeTokens } from '../theme/types';

export type ChartColorTokens = {
  bull: string;
  bear: string;
  line: string;
  lineMuted: string;
};

/** Fixed hues for categorical portfolio / allocation charts. */
export const compositionSliceColors = [
  '#6383ff',
  '#8b5cf6',
  '#06b6d4',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#64748b',
] as const;

export function getChartColorTokens(tokens: ThemeTokens): ChartColorTokens {
  const c = tokens.colors;
  return {
    bull: c.success[500],
    bear: c.danger[500],
    line: tokens.isDark ? '#6383ff' : c.primary[500],
    lineMuted: tokens.textMuted,
  };
}
