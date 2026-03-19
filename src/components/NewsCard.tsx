import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { openInAppBrowser } from '../utils/browser';
import { trackEvent } from '../utils/trackEvent';
import { MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import { FeedCardProps } from '../types';
import { CoinChip } from './CoinChip';
import { ReactionPicker } from './ReactionPicker';
import { formatTimeAgo, abbreviateNumber } from '../utils/format';
import { colors, borderRadius, shadows, spacing, semantic, typography } from '../theme/theme';
import { useHasFeature } from '../utils/features';

const COLLAPSED_LINES = 3;

function areNewsCardPropsEqual(prev: FeedCardProps, next: FeedCardProps): boolean {
  if (prev.variant !== next.variant) return false;
  const a = prev.item;
  const b = next.item;
  if (a.id !== b.id) return false;
  if (a.userReaction !== b.userReaction) return false;
  if (a.isSaved !== b.isSaved) return false;
  if (a.comments !== b.comments) return false;
  if ((a.saveCount ?? 0) !== (b.saveCount ?? 0)) return false;
  if ((a.reactions?.total ?? 0) !== (b.reactions?.total ?? 0)) return false;
  return true;
}

export const NewsCard = React.memo<FeedCardProps>(({
  item,
  variant = 'compact',
  onReact,
  onComment,
  onShare,
  onSave,
  onCoinPress,
}) => {
  const hasFollow = useHasFeature('follow');
  const hasComments = useHasFeature('comments');
  const [isExpanded, setIsExpanded] = useState(false);
  const isSaved = item.isSaved || false;
  const isGrid = variant === 'grid';
  const articleSaveCount = item.saveCount ?? 0;

  const fullText = item.subtitle || item.content || item.snippet;

  if (isGrid) {
    return (
      <View style={[styles.container, styles.gridContainer]}>
        <Text style={styles.gridSource}>{item.source}</Text>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.gridSnippet} numberOfLines={3}>
          {item.subtitle || item.snippet || item.content || ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.coinAvatarPlaceholder}>
            <Text style={styles.coinAvatarText}>
              {item.coins[0]?.symbol[0] || 'C'}
            </Text>
          </View>
          <View>
            <Text style={styles.coinName}>{item.coins[0]?.name || 'Crypto'}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.publishedAt)}</Text>
          </View>
        </View>
        {hasFollow && item.coins[0]?.isFollowing && (
          <View style={styles.followingBadge}>
            <Text style={styles.followingText}>Following</Text>
          </View>
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

      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
          accessibilityLabel="Article image"
          transition={200}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoriesRow}>
            {item.categories.map((cat) => (
              <View key={cat.key} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        )}
        {item.relatedCoins && item.relatedCoins.length > 0 && (
          <View style={styles.relatedCoinsSection}>
            <Text style={styles.relatedCoinsHeader}>Related Coins</Text>
            <View style={styles.relatedCoinsRow}>
              {item.relatedCoins.map((coinId) => (
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
        <Text
          style={styles.snippet}
          numberOfLines={isExpanded ? 0 : COLLAPSED_LINES}
        >
          {fullText}
        </Text>
        {fullText.length > 0 && (
          <TouchableOpacity
            onPress={() => setIsExpanded((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.showMoreTouchable}
          >
            <Text style={styles.showMoreText}>
              {isExpanded ? 'show less' : 'show more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.source} numberOfLines={1}>
          {item.source}
        </Text>
        {(item.url || item.sourceUrl) && (
          <TouchableOpacity
            onPress={() => {
              trackEvent({ featureKey: 'news_feed', eventType: 'article_opened', metadata: { newsId: item.id } });
              openInAppBrowser(item.url || item.sourceUrl!);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.readFullTouchable}
          >
            <Text style={styles.readFullLink}>Read full article</Text>
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
            accessibilityLabel="Comment"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MessageCircle size={20} color={colors.neutral[500]} />
            <Text style={styles.actionText}>{abbreviateNumber(item.comments)}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Share"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={20} color={colors.neutral[500]} />
          <Text style={styles.actionText}>{abbreviateNumber(item.shares)}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSave?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark
            size={20}
            color={isSaved ? colors.primary[500] : colors.neutral[500]}
            fill={isSaved ? colors.primary[500] : 'none'}
          />
          <Text style={[styles.actionText, isSaved && styles.actionTextSaved]}>
            {abbreviateNumber(articleSaveCount)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, areNewsCardPropsEqual);

const styles = StyleSheet.create({
  container: {
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadius,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...semantic.cardShadow,
    overflow: 'hidden',
  },
  gridContainer: {
    marginHorizontal: 0,
    marginBottom: 0,
    padding: spacing.sm,
    ...semantic.cardShadow,
  },
  gridSource: {
    fontSize: typography.fontSizes.badge,
    color: colors.neutral[500],
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  gridTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  gridSnippet: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
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
  coinAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  coinAvatarText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },
  coinName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  timeAgo: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  followingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.sm,
  },
  followingText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[700],
  },
  coinsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  moreCoins: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.neutral[200],
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  snippet: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  showMoreTouchable: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  showMoreText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[500],
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: semantic.cardRadiusSmall,
    backgroundColor: colors.primary[100],
  },
  categoryBadgeText: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[700],
  },
  relatedCoinsSection: {
    marginBottom: spacing.sm,
  },
  relatedCoinsHeader: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[600],
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    minHeight: 0,
  },
  source: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.fontWeights.medium,
  },
  readFullTouchable: {
    flexShrink: 0,
  },
  readFullLink: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[500],
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
    color: colors.neutral[500],
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  },
  actionTextSaved: {
    color: colors.primary[500],
  },
  spacer: {
    flex: 1,
  },
});
