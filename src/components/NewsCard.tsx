import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { openInAppBrowser } from '../utils/browser';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import { FeedCardProps } from '../types';
import { CoinChip } from './CoinChip';
import { formatTimeAgo, abbreviateNumber } from '../utils/format';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';

const COLLAPSED_LINES = 3;

export const NewsCard: React.FC<FeedCardProps> = ({
  item,
  variant = 'compact',
  onLike,
  onComment,
  onShare,
  onSave,
  onCoinPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLiked = item.isLiked || false;
  const isSaved = item.isSaved || false;
  const isGrid = variant === 'grid';

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
        {item.coins[0]?.isFollowing && (
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
          accessibilityLabel="Article image"
          resizeMode="cover"
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
            onPress={() => openInAppBrowser(item.url || item.sourceUrl!)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.readFullTouchable}
          >
            <Text style={styles.readFullLink}>Read full article</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={20}
            color={isLiked ? colors.danger[500] : colors.neutral[500]}
            fill={isLiked ? colors.danger[500] : 'none'}
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            {abbreviateNumber(item.likes)}
          </Text>
        </TouchableOpacity>

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
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  gridContainer: {
    marginHorizontal: 0,
    marginBottom: 0,
    padding: spacing.sm,
    ...shadows.sm,
  },
  gridSource: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  gridSnippet: {
    fontSize: 12,
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
    marginRight: 12,
  },
  coinAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  coinName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  timeAgo: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  followingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primary[100],
    borderRadius: 12,
  },
  followingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  coinsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  moreCoins: {
    fontSize: 13,
    color: colors.neutral[500],
    alignSelf: 'center',
    marginLeft: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  snippet: {
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  showMoreTouchable: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[500],
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
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
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  readFullTouchable: {
    flexShrink: 0,
  },
  readFullLink: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 13,
    color: colors.neutral[500],
    marginLeft: 6,
    fontWeight: '500',
  },
  actionTextActive: {
    color: colors.danger[500],
  },
  spacer: {
    flex: 1,
  },
});
