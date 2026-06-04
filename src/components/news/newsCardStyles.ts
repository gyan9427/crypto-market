import { StyleSheet } from 'react-native';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export function buildNewsCardStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const { semantic, spacing, typography, borderRadius } = tokens;
  return StyleSheet.create({
  container: {
    backgroundColor: tokens.surface,
    borderRadius: semantic.cardRadius,
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
    backgroundColor: tokens.isDark
      ? 'rgba(168,85,247,0.08)'
      : 'rgba(168,85,247,0.04)',
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.button,
    backgroundColor: c.primary[500],
    borderWidth: 1,
    borderColor: c.primary[500],
    flexShrink: 0,
  },
  followButtonFollowing: {
    backgroundColor: tokens.surface,
    borderColor: tokens.borderStrong,
  },
  followText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: c.white,
    letterSpacing: typography.letterSpacing.button,
  },
  followTextFollowing: {
    color: tokens.text,
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
    backgroundColor: tokens.isDark
      ? 'rgba(168,85,247,0.15)'
      : 'rgba(168,85,247,0.10)',
    borderWidth: 1,
    borderColor: tokens.isDark
      ? 'rgba(168,85,247,0.30)'
      : 'rgba(168,85,247,0.25)',
  },
  relatedCoinBadgeText: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.isDark ? c.primary[400] : c.primary[700],
    letterSpacing: typography.letterSpacing.button,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
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
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    backgroundColor: tokens.isDark
      ? 'rgba(168,85,247,0.12)'
      : 'rgba(168,85,247,0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.isDark
      ? 'rgba(168,85,247,0.25)'
      : 'rgba(168,85,247,0.20)',
    gap: 4,
  },
  primaryCtaText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: tokens.isDark ? c.primary[400] : c.primary[700],
    letterSpacing: typography.letterSpacing.button,
  },
  openSiteTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  openSiteText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.sansSemiBold,
    color: c.primary[tokens.isDark ? 400 : 500],
    letterSpacing: typography.letterSpacing.button,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
});
}
