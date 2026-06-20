import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';

const MARKET_ACCENT = '#6383ff';

/** Fixed height for composition / intelligence carousel cards. */
export const PORTFOLIO_INSIGHT_CAROUSEL_CARD_HEIGHT = 260;

export function usePiStyles() {
  const { tokens } = useAppTheme();
  return useMemo(() => buildPiStyles(tokens), [tokens]);
}

export function healthScoreColor(score: number | null | undefined, tokens: ThemeTokens): string {
  if (score == null || !Number.isFinite(score)) return tokens.textMuted;
  if (score >= 70) return tokens.colors.success?.[500] ?? '#22c55e';
  if (score >= 40) return '#f59e0b';
  return tokens.colors.error?.[500] ?? '#ef4444';
}

export function severityColor(severity: string, tokens: ThemeTokens): string {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return tokens.colors.error?.[500] ?? '#ef4444';
  if (s === 'medium' || s === 'moderate') return '#f59e0b';
  if (s === 'low' || s === 'info') return MARKET_ACCENT;
  return tokens.textMuted;
}

function buildPiStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';
  const cardBg = tokens.isDark ? '#0f0f14' : tokens.surface;

  return StyleSheet.create({
    sectionWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: tokens.semantic?.cardRadius ?? 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(255,255,255,0.08)' : tokens.borderSubtle,
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
      backgroundColor: accentBg,
    },
    badgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      color: MARKET_ACCENT,
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
      borderTopColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
    },
    linkText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: MARKET_ACCENT,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.08)' : tokens.colors.neutral?.[100] ?? '#f3f4f6',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: MARKET_ACCENT,
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
      backgroundColor: tokens.isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.1)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.25)',
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
      backgroundColor: cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
    },
  });
}

export { MARKET_ACCENT };
