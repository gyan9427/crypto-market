import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { openInAppBrowser } from '../utils/browser';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../utils/trackEvent';
import { MessageCircle, Share2, Bookmark, ChevronRight, ExternalLink } from 'lucide-react-native';
import { FeedCardProps } from '../types';
import { CoinChip } from './CoinChip';
import { ReactionPicker } from './ReactionPicker';
import { formatTimeAgo, abbreviateNumber } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useHasFeature } from '../utils/features';
import { useAppStore } from '../state/useAppStore';

const TITLE_LINES_FEED = 2;
const SNIPPET_LINES_FEED = 2;

function normalizeText(s: string): string {
  return s.trim().toLowerCase();
}

/** True if body text duplicates the headline for feed display. */
function isDuplicateOfTitle(title: string, body: string): boolean {
  const t = normalizeText(title);
  const b = normalizeText(body);
  if (!b.length) return true;
  if (b === t) return true;
  if (b.startsWith(t) && b.length <= t.length + 3) return true;
  return b.startsWith(t + ' ') || b.startsWith(t + '—') || b.startsWith(t + '–');
}

function rawSnippetFields(item: { subtitle?: string; content?: string; snippet: string }): string {
  return item.subtitle || item.content || item.snippet || '';
}

function coinHeaderTitle(coin: { name: string; symbol: string }): string {
  return `${coin.name}${coin.symbol ? ` · ${coin.symbol}` : ''}`;
}

function areNewsCardPropsEqual(prev: FeedCardProps, next: FeedCardProps): boolean {
  if (prev.variant !== next.variant) return false;
  if (prev.onPress !== next.onPress) return false;
  const a = prev.item;
  const b = next.item;
  if (a.id !== b.id) return false;
  if (a.userReaction !== b.userReaction) return false;
  if (a.isSaved !== b.isSaved) return false;
  if (a.comments !== b.comments) return false;
  if (a.shares !== b.shares) return false;
  if ((a.saveCount ?? 0) !== (b.saveCount ?? 0)) return false;
  if ((a.reactions?.total ?? 0) !== (b.reactions?.total ?? 0)) return false;
  if (a.title !== b.title) return false;
  if (a.snippet !== b.snippet) return false;
  if (a.subtitle !== b.subtitle) return false;
  if (a.imageUrl !== b.imageUrl) return false;
  if (a.source !== b.source) return false;
  const ac = a.coins[0];
  const bc = b.coins[0];
  if ((ac?.id ?? '') !== (bc?.id ?? '')) return false;
  if ((ac?.name ?? '') !== (bc?.name ?? '')) return false;
  if ((ac?.isFollowing ?? false) !== (bc?.isFollowing ?? false)) return false;
  return true;
}

export const NewsCard = React.memo<FeedCardProps>(({
  item,
  variant = 'compact',
  onReact,
  onComment,
  onShare,
  onSave,
  onPress,
  onCoinPress,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildNewsCardStyles(tokens), [tokens]);
  const c = tokens.colors;
  const hasFollow = useHasFeature('follow');
  const hasComments = useHasFeature('comments');
  const isSaved = item.isSaved || false;
  const isGrid = variant === 'grid';
  const isExpandedLayout = variant === 'expanded';
  const articleSaveCount = item.saveCount ?? 0;

  const followingCoins = useAppStore((s) => s.followingCoins);
  const toggleFollowCoin = useAppStore((s) => s.toggleFollowCoin);
  const [followBusy, setFollowBusy] = useState(false);

  const feedSnippet = useMemo(() => {
    const raw = rawSnippetFields(item);
    if (!raw.trim()) return '';
    if (isDuplicateOfTitle(item.title, raw)) return '';
    return raw;
  }, [item]);

  const handleFollowToggle = useCallback(async () => {
    const coin = item.coins[0];
    if (!coin) return;
    setFollowBusy(true);
    try {
      await toggleFollowCoin(coin.id);
    } finally {
      setFollowBusy(false);
    }
  }, [item.coins, toggleFollowCoin]);

  if (isGrid) {
    const gCoin = item.coins[0];
    const gridAttribution = gCoin ? coinHeaderTitle(gCoin) : item.source;
    return (
      <View style={[styles.container, styles.gridContainer]}>
        <Text style={styles.gridSource}>{gridAttribution}</Text>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.gridSnippet} numberOfLines={3}>
          {item.subtitle || item.snippet || item.content || ''}
        </Text>
      </View>
    );
  }

  const primaryCoin = item.coins[0];
  const showRelatedInCard = isExpandedLayout && item.relatedCoins && item.relatedCoins.length > 0;

  const isFollowingCoin =
    primaryCoin != null &&
    (followingCoins.includes(primaryCoin.id) || Boolean(primaryCoin.isFollowing));

  const openExternalArticle = () => {
    trackEvent({
      featureKey: 'news_feed',
      eventType: 'article_opened',
      metadata: { newsId: item.id },
    });
    openInAppBrowser(item.url || item.sourceUrl!);
  };

  const avatarInitial = primaryCoin
    ? (primaryCoin.symbol?.[0] || primaryCoin.name?.[0] || 'C').toUpperCase()
    : (item.source?.[0] ?? 'C').toUpperCase();

  const headerPrimaryLine = primaryCoin
    ? coinHeaderTitle(primaryCoin)
    : item.source || t('news.defaultAttribution');

  const headerAvatar = primaryCoin?.logo ? (
    <Image
      source={{ uri: primaryCoin.logo }}
      style={styles.coinAvatarImage}
      contentFit="cover"
      accessibilityLabel={t('accessibility.coinLogo', { name: primaryCoin.name })}
    />
  ) : (
    <View style={styles.coinAvatarPlaceholder}>
      <Text style={styles.coinAvatarText}>{avatarInitial}</Text>
    </View>
  );

  const attributionBlock = (
    <View style={styles.headerLeft}>
      {headerAvatar}
      <View style={styles.headerTitles}>
        <Text style={styles.sourceAttribution} numberOfLines={1}>
          {headerPrimaryLine}
        </Text>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.publishedAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {primaryCoin != null ? (
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => onCoinPress?.(primaryCoin.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('news.openCoinProfile', { name: primaryCoin.name })}
          >
            {headerAvatar}
            <View style={styles.headerTitles}>
              <Text style={styles.sourceAttribution} numberOfLines={1}>
                {headerPrimaryLine}
              </Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.publishedAt)}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          attributionBlock
        )}
      </View>

      {item.coins.length > 0 && (
        <View style={styles.coinsRow}>
          {item.coins.slice(0, 3).map((coin) => (
            <CoinChip key={coin.id} coin={coin} onPress={onCoinPress} />
          ))}
          {item.coins.length > 3 && (
            <Text style={styles.moreCoins}>+{item.coins.length - 3}</Text>
          )}
        </View>
      )}

      <View style={styles.heroOuter}>
        <Pressable
          onPress={() => onPress?.(item.id)}
          disabled={!onPress}
          style={({ pressed }) => [
            styles.heroPressable,
            pressed && onPress && styles.cardPressablePressed,
          ]}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={onPress ? t('news.openArticleTitle', { title: item.title }) : undefined}
        >
          <View style={styles.heroWrap}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                accessibilityLabel={t('accessibility.articleImage')}
                transition={200}
              />
            ) : (
              <View style={styles.heroPlaceholder} accessibilityLabel={t('accessibility.noArticleImage')}>
                <Text style={styles.heroPlaceholderText}>
                  {(item.source?.[0] ?? 'N').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
        {hasFollow && primaryCoin != null && (
          <TouchableOpacity
            style={[styles.heroFollowButton, isFollowingCoin && styles.heroFollowButtonFollowing]}
            onPress={handleFollowToggle}
            disabled={followBusy}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isFollowingCoin ? t('accessibility.unfollowCoin') : t('accessibility.followCoin')}
          >
            <Text style={[styles.heroFollowText, isFollowingCoin && styles.heroFollowTextFollowing]}>
              {followBusy ? t('common.ellipsis') : isFollowingCoin ? t('coin.following') : t('coin.follow')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Pressable
        onPress={() => onPress?.(item.id)}
        disabled={!onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && onPress && styles.cardPressablePressed]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? t('news.openArticleTitle', { title: item.title }) : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={TITLE_LINES_FEED}>
            {item.title}
          </Text>
          {showRelatedInCard && (
            <View style={styles.relatedCoinsSection}>
              <Text style={styles.relatedCoinsHeader}>{t('news.relatedCoins')}</Text>
              <View style={styles.relatedCoinsRow}>
                {item.relatedCoins!.map((coinId) => (
                  <TouchableOpacity
                    key={coinId}
                    style={styles.relatedCoinBadge}
                    onPress={() => onCoinPress?.(coinId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.relatedCoinBadgeText}>{coinId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {feedSnippet.length > 0 && (
            <Text style={styles.snippet} numberOfLines={SNIPPET_LINES_FEED}>
              {feedSnippet}
            </Text>
          )}
          <Text style={styles.sourceMeta} numberOfLines={1}>
            @{item.source}
          </Text>
        </View>
      </Pressable>

      <View style={styles.footerRow}>
        {onPress ? (
          <TouchableOpacity
            onPress={() => onPress(item.id)}
            style={styles.primaryCta}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.readArticle')}
          >
            <Text style={styles.primaryCtaText}>{t('news.read')}</Text>
            <ChevronRight size={18} color={c.primary[600]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.footerSpacer} />
        )}
        {(item.url || item.sourceUrl) && (
          <TouchableOpacity
            onPress={openExternalArticle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.openSiteTouchable}
            accessibilityRole="link"
            accessibilityLabel={t('accessibility.openInBrowser')}
          >
            <ExternalLink size={16} color={c.primary[500]} />
            <Text style={styles.openSiteText}>{t('news.fullArticle')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionsRow}>
        <ReactionPicker
          reactions={item.reactions}
          userReaction={item.userReaction}
          onReact={(type) => onReact?.(item.id, type)}
        />

        {hasComments && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment?.(item.id)}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.comment')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MessageCircle size={20} color={tokens.textMuted} />
            {item.comments > 0 && (
              <Text style={styles.actionText}>{abbreviateNumber(item.comments)}</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.share')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={20} color={tokens.textMuted} />
          {item.shares > 0 && (
            <Text style={styles.actionText}>{abbreviateNumber(item.shares)}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSave?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? t('accessibility.unsaveArticle') : t('accessibility.saveArticle')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark
            size={20}
            color={isSaved ? c.primary[500] : tokens.textMuted}
            fill={isSaved ? c.primary[500] : 'none'}
          />
          {(isSaved || articleSaveCount > 0) && (
            <Text style={[styles.actionText, isSaved && styles.actionTextSaved]}>
              {abbreviateNumber(articleSaveCount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}, areNewsCardPropsEqual);

NewsCard.displayName = 'NewsCard';

function buildNewsCardStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const { semantic, spacing, typography, borderRadius } = tokens;
  return StyleSheet.create({
  container: {
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadius,
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
    marginBottom: spacing.xs,
  },
  gridTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: c.neutral[900],
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  gridSnippet: {
    fontSize: typography.fontSizes.xs,
    color: c.neutral[600],
    lineHeight: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
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
    color: c.neutral[800],
  },
  coinAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: c.neutral[200],
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
    color: c.white,
  },
  timeAgo: {
    fontSize: typography.fontSizes.xs,
    color: tokens.textMuted,
    marginTop: 2,
  },
  coinsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  moreCoins: {
    fontSize: typography.fontSizes.sm,
    color: tokens.textMuted,
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  heroOuter: {
    position: 'relative',
    width: '100%',
  },
  heroPressable: {
    width: '100%',
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: c.neutral[200],
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: c.neutral[200],
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: c.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 32,
    fontWeight: typography.fontWeights.bold,
    color: c.neutral[500],
  },
  heroFollowButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.button,
    backgroundColor: c.primary[500],
    borderWidth: 1,
    borderColor: c.primary[500],
  },
  heroFollowButtonFollowing: {
    backgroundColor: semantic.surface,
    borderColor: c.neutral[300],
  },
  heroFollowText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: c.white,
  },
  heroFollowTextFollowing: {
    color: c.neutral[700],
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: c.neutral[900],
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  snippet: {
    fontSize: typography.fontSizes.sm,
    color: c.neutral[600],
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  sourceMeta: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    color: tokens.textMuted,
    fontWeight: typography.fontWeights.medium,
  },
  relatedCoinsSection: {
    marginBottom: spacing.sm,
  },
  relatedCoinsHeader: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    color: c.neutral[600],
    marginBottom: spacing.xs,
  },
  relatedCoinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  relatedCoinBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: semantic.cardRadiusSmall,
    backgroundColor: '#FEF08A',
  },
  relatedCoinBadgeText: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    color: '#854D0E',
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
    borderTopColor: c.neutral[200],
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
    backgroundColor: c.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: c.primary[200],
    gap: 4,
  },
  primaryCtaText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: c.primary[700],
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
    color: c.primary[500],
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
