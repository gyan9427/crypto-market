import { StyleSheet } from 'react-native';
import type { ThemeTokens } from '@/src/design-system/theme/types';

import { getMarketUiPalette } from '@/src/theme/chartPalette';

export function buildNewsCardStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const ui = getMarketUiPalette(tokens);
  const { semantic, spacing, typography, borderRadius } = tokens;
  return StyleSheet.create({
  container: {
    backgroundColor: tokens.surface,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: tokens.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...semantic.cardShadow,
    overflow: 'hidden',
  },
  cardPressable: {
    width: '100%',
  },
  cardPressablePressed: {
    opacity: 0.96,
  },
  gridContainer: {
    marginHorizontal: 0,
    marginBottom: 0,
    padding: spacing.sm,
    ...semantic.cardShadow,
  },
  gridSource: {
    fontSize: typography.fontSizes.badge,
    color: tokens.textMuted,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    marginBottom: spacing.xs,
    letterSpacing: typography.letterSpacing.eyebrow * 0.5,
    textTransform: 'uppercase',
  },
  gridTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.text,
    lineHeight: 18,
    letterSpacing: typography.letterSpacing.caption,
    marginBottom: spacing.xs,
  },
  gridSnippet: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    lineHeight: 16,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  sourceAttribution: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.text,
    letterSpacing: typography.letterSpacing.caption,
  },
  coinAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: tokens.border,
  },
  coinAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  coinAvatarText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.sansBold,
    color: c.white,
  },
  timeAgo: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  coinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  moreCoins: {
    fontSize: typography.fontSizes.sm,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTopBarLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTopBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  cardTopBarSymbol: {
    fontSize: typography.fontSizes.sm,
    fontFamily: typography.fontFamilies.sansSemiBold,
    fontWeight: typography.fontWeights.semibold,
    color: tokens.text,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.caption,
    flexShrink: 0,
  },
  heroOuter: {
    width: '100%',
  },
  heroPressable: {
    width: '100%',
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: tokens.isDark ? c.neutral[800] : c.neutral[200],
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.isDark ? c.neutral[800] : c.neutral[200],
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: ui.newsHeroPlaceholderBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 32,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.sansBold,
    color: tokens.isDark ? c.primary[700] : c.primary[200],
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: tokens.isDark
      ? c.primary[900]
      : c.primary[50],
    borderWidth: 1,
    borderColor: tokens.isDark
      ? c.primary[700]
      : c.primary[200],
    flexShrink: 0,
    gap: 3,
  },
  followButtonFollowing: {
    backgroundColor: tokens.isDark
      ? c.primary[900]
      : c.primary[50],
    borderColor: tokens.isDark
      ? c.primary[700]
      : c.primary[200],
  },
  followText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.isDark ? c.primary[400] : c.primary[700],
    letterSpacing: typography.letterSpacing.button,
  },
  followTextFollowing: {
    color: tokens.isDark ? c.primary[400] : c.primary[700],
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.text,
    lineHeight: 24,
    letterSpacing: typography.letterSpacing.subheading * 0.5,
    marginBottom: spacing.sm,
  },
  snippet: {
    fontSize: typography.fontSizes.sm,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  sourceMeta: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sansMedium,
    color: tokens.textMuted,
    fontWeight: typography.fontWeights.medium,
  },
  relatedCoinsSection: {
    marginBottom: spacing.sm,
  },
  relatedCoinsHeader: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.eyebrow * 0.5,
  },
  relatedCoinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  relatedCoinBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    backgroundColor: ui.relatedCoinBadgeBg,
    borderWidth: 1,
    borderColor: ui.relatedCoinBadgeBorder,
  },
  relatedCoinBadgeText: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.isDark ? c.primary[400] : c.primary[700],
    letterSpacing: typography.letterSpacing.button,
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: tokens.borderSubtle,
    marginHorizontal: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.borderSubtle,
  },
  footerSpacer: {
    flex: 1,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryCtaTextWrap: {
    flexDirection: 'column',
  },
  primaryCtaLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: c.primary[tokens.isDark ? 400 : 500],
    letterSpacing: typography.letterSpacing.button,
  },
  primaryCtaSubLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.regular,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    letterSpacing: typography.letterSpacing.caption,
  },
  primaryCtaText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.isDark ? c.primary[400] : c.primary[700],
    letterSpacing: typography.letterSpacing.button,
  },
  openSiteTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openSiteTextWrap: {
    flexDirection: 'column',
  },
  openSiteText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: c.primary[tokens.isDark ? 400 : 500],
    letterSpacing: typography.letterSpacing.button,
  },
  openSiteSourceName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.regular,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    letterSpacing: typography.letterSpacing.caption,
  },
  tagsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagsActionsRowTags: {
    flex: 1,
    marginBottom: 0,
  },
  tagsActionsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: typography.fontSizes.sm,
    fontFamily: typography.fontFamilies.sansMedium,
    color: tokens.textMuted,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  },
  actionTextSaved: {
    color: c.primary[500],
  },
  spacer: {
    flex: 1,
  },

  // ── "Because you follow" banner ─────────────────────────────────────────
  followBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: tokens.isDark ? c.primary[900] : c.primary[50],
    gap: 6,
  },
  followBannerText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sansMedium,
    fontWeight: typography.fontWeights.medium,
    color: tokens.isDark ? c.primary[400] : c.primary[700],
  },

  // ── Source meta inside topbar ────────────────────────────────────────────
  cardTopBarSource: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
    flex: 1,
    minWidth: 0,
  },

  // ── AI Summary row ───────────────────────────────────────────────────────
  aiSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.borderSubtle,
  },
  aiSummaryText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sansMedium,
    fontWeight: typography.fontWeights.medium,
    color: tokens.isDark ? c.primary[400] : c.primary[600],
  },
  aiSummaryDot: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
  },
  aiSummaryReadTime: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sans,
    color: tokens.textMuted,
  },

  // ── Save count avatars ───────────────────────────────────────────────────
  savedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.isDark ? c.neutral[700] : c.neutral[300],
    borderWidth: 1.5,
    borderColor: tokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  savedAvatarFirst: {
    marginLeft: 0,
  },
  savedAvatarText: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.isDark ? c.neutral[200] : c.neutral[600],
  },
  savedCountText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sansMedium,
    color: tokens.textMuted,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.sansMedium,
    fontWeight: typography.fontWeights.medium,
    color: tokens.textMuted,
  },
});
}
