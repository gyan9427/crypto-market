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
  chipOnBorder: string;
  chipOnBg: string;
  subtleFill: string;
  followingChipBorder: string;
  changeBadgeUpBg: string;
  changeBadgeDnBg: string;
  crosshairPanelBg: string;
  crosshairPanelBorder: string;
  successHighlightBg: string;
  positiveSignalBg: string;
  negativeSignalBg: string;
  orderAskBarBg: string;
  orderBidBarBg: string;
  primaryTintBg: string;
  primaryTintBgSubtle: string;
  primaryTintBorder: string;
  primaryBadgeBg: string;
  featuredOverlayEnd: string;
  featuredCardShadowWebDark: string;
  featuredCardShadowWebLight: string;
  featuredImagePlaceholderBg: string;
  onImageTextMuted: string;
  errorBoundaryPanelBg: string;
  errorBoundaryIconBg: string;
  errorBoundaryIconBorder: string;
  errorBoundaryGradientMid: string;
  errorBoundaryStatusOkBg: string;
  errorBoundaryStatusOkBorder: string;
  errorBoundaryStatusMutedBg: string;
  newsHeroPlaceholderBg: string;
  relatedCoinBadgeBg: string;
  relatedCoinBadgeBorder: string;
  overlayControlBg: string;
  pillSelectedBg: string;
  segmentIndicatorShadow: string;
  filterPillActiveTextLight: string;
  dangerTintBg: string;
  marketAnalysisFollowingBg: string;
  shadowColor: string;
  languageRowSelectedBg: string;
};

export const MENTION_AVATAR_COLORS = [
  MARKET_ACCENT,
  '#f59e0b',
  '#06b6d4',
] as const;

export function getMarketUiPalette(tokens: ThemeTokens): MarketUiPalette {
  const c = tokens.colors;
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
    chipOnBorder: tokens.isDark ? 'rgba(99,131,255,0.4)' : 'rgba(99,131,255,0.35)',
    chipOnBg: tokens.isDark ? 'rgba(99,131,255,0.1)' : 'rgba(99,131,255,0.08)',
    subtleFill: tokens.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    followingChipBorder: tokens.isDark ? 'rgba(99,131,255,0.35)' : 'rgba(99,131,255,0.25)',
    changeBadgeUpBg: 'rgba(39,196,133,0.13)',
    changeBadgeDnBg: 'rgba(240,82,82,0.13)',
    crosshairPanelBg: tokens.isDark ? 'rgba(22,22,28,0.92)' : 'rgba(250,250,252,0.96)',
    crosshairPanelBorder: tokens.isDark ? 'rgba(99,131,255,0.28)' : 'rgba(99,131,255,0.35)',
    successHighlightBg: tokens.colors.success[500] + '22',
    positiveSignalBg: 'rgba(34, 197, 94, 0.14)',
    negativeSignalBg: 'rgba(239, 68, 68, 0.12)',
    orderAskBarBg: 'rgba(240,82,82,0.14)',
    orderBidBarBg: 'rgba(39,196,133,0.14)',
    primaryTintBg: tokens.isDark ? 'rgba(168,85,247,0.12)' : c.primary[100],
    primaryTintBgSubtle: tokens.isDark ? 'rgba(168,85,247,0.10)' : c.primary[50],
    primaryTintBorder: tokens.isDark ? 'rgba(168,85,247,0.20)' : 'rgba(168,85,247,0.18)',
    primaryBadgeBg: 'rgba(168,85,247,0.80)',
    featuredOverlayEnd: 'rgba(0,0,0,0.72)',
    featuredCardShadowWebDark: '0 12px 40px rgba(0,0,0,0.35)',
    featuredCardShadowWebLight:
      '0 8px 32px rgba(88,28,135,0.15), 0 2px 8px rgba(0,0,0,0.06)',
    featuredImagePlaceholderBg: tokens.isDark
      ? 'rgba(168,85,247,0.10)'
      : 'rgba(168,85,247,0.06)',
    onImageTextMuted: 'rgba(255,255,255,0.70)',
    errorBoundaryPanelBg: tokens.isDark
      ? 'rgba(10, 10, 15, 0.55)'
      : 'rgba(255, 255, 255, 0.72)',
    errorBoundaryIconBg: tokens.isDark ? 'rgba(168, 85, 247, 0.2)' : c.primary[50],
    errorBoundaryIconBorder: tokens.isDark ? 'rgba(168, 85, 247, 0.35)' : c.primary[100],
    errorBoundaryGradientMid: tokens.isDark ? '#140820' : c.primary[50],
    errorBoundaryStatusOkBg: tokens.isDark ? 'rgba(26, 138, 90, 0.2)' : 'rgba(26, 138, 90, 0.1)',
    errorBoundaryStatusOkBorder: tokens.isDark
      ? 'rgba(26, 138, 90, 0.45)'
      : c.success[500] + '33',
    errorBoundaryStatusMutedBg: tokens.isDark ? 'rgba(255,255,255,0.06)' : c.neutral[100],
    newsHeroPlaceholderBg: tokens.isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.04)',
    relatedCoinBadgeBg: tokens.isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.10)',
    relatedCoinBadgeBorder: tokens.isDark ? 'rgba(168,85,247,0.30)' : 'rgba(168,85,247,0.25)',
    overlayControlBg: 'rgba(10, 10, 15, 0.45)',
    pillSelectedBg: 'rgba(168, 85, 247, 0.05)',
    segmentIndicatorShadow: tokens.isDark ? '#000' : 'rgba(88,28,135,0.15)',
    filterPillActiveTextLight: c.white,
    dangerTintBg: tokens.isDark ? 'rgba(239,68,68,0.15)' : c.error[100],
    marketAnalysisFollowingBg: tokens.isDark ? 'rgba(168,85,247,0.10)' : c.primary[50],
    shadowColor: '#000',
    languageRowSelectedBg: 'rgba(168, 85, 247, 0.12)',
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
