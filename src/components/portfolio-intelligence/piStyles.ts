import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import {
  getMarketUiPalette,
  healthScoreColor,
  MARKET_ACCENT,
  severityColor,
} from '@/src/theme/chartPalette';

/** Fixed height for composition / intelligence carousel cards. */
export const PORTFOLIO_INSIGHT_CAROUSEL_CARD_HEIGHT = 260;

export function usePiStyles() {
  const { tokens } = useAppTheme();
  return useMemo(() => buildPiStyles(tokens), [tokens]);
}

export { healthScoreColor, severityColor, MARKET_ACCENT };

function buildPiStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  const ui = getMarketUiPalette(tokens);

  return StyleSheet.create({
    sectionWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    card: {
      backgroundColor: ui.cardBg,
      borderRadius: tokens.semantic?.cardRadius ?? 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    carouselCard: {
      height: PORTFOLIO_INSIGHT_CAROUSEL_CARD_HEIGHT,
      justifyContent: 'space-between',
    },
    carouselBody: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 108,
    },
    carouselHint: {
      minHeight: 40,
      justifyContent: 'center',
      marginTop: 8,
    },
    carouselLegendSlot: {
      minHeight: 22,
      justifyContent: 'center',
    },
    carouselCardShell: {
      height: PORTFOLIO_INSIGHT_CAROUSEL_CARD_HEIGHT,
    },
    cardTitle: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
      marginBottom: 12,
    },
    cardSubtitle: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginBottom: 8,
      fontFamily: typo.fontFamilies.sansMedium,
    },
    eyebrow: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textMuted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    metricLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: ui.accentBg,
    },
    badgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      color: ui.accent,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.borderSubtle,
    },
    linkText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: ui.accent,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.isDark ? tokens.border : tokens.colors.neutral[100],
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: ui.accent,
    },
    barLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    barLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansMedium,
    },
    barPct: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
    },
    ringOuter: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringScore: {
      fontSize: 18,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    insightSummary: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      marginTop: 4,
      lineHeight: 20,
    },
    staleBanner: {
      marginHorizontal: 16,
      marginTop: 8,
      padding: 12,
      borderRadius: 10,
      backgroundColor: ui.warningBannerBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.warningBannerBorder,
    },
    staleText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.text,
      lineHeight: 20,
    },
    skeletonCard: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: ui.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.borderSubtle,
    },
  });
}
