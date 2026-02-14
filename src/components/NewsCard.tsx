import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import { FeedCardProps } from '../types';
import { CoinChip } from './CoinChip';
import { formatTimeAgo, abbreviateNumber } from '../utils/format';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';

const COLLAPSED_MAX_LENGTH = 120;
const COLLAPSED_HEIGHT = 140;
const SPRING_CONFIG = { damping: 22, stiffness: 90 };

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
  const [expandedHeight, setExpandedHeight] = useState(0);
  const [isAnimatingCollapse, setIsAnimatingCollapse] = useState(false);
  const isLiked = item.isLiked || false;
  const isSaved = item.isSaved || false;

  const fullText = item.content || item.snippet;
  const isTruncatable = fullText.length > COLLAPSED_MAX_LENGTH;
  const contentHeight = useSharedValue(COLLAPSED_HEIGHT);

  const displayText = isExpanded || isAnimatingCollapse
    ? fullText
    : isTruncatable
      ? fullText.slice(0, COLLAPSED_MAX_LENGTH).trim() + '...'
      : fullText;

  const finishCollapse = useCallback(() => {
    setIsExpanded(false);
    setIsAnimatingCollapse(false);
  }, []);

  const toggleExpand = () => {
    if (isExpanded) {
      setIsAnimatingCollapse(true);
      contentHeight.value = withSpring(
        COLLAPSED_HEIGHT,
        SPRING_CONFIG,
        (finished) => {
          if (finished === true) {
            runOnJS(finishCollapse)();
          }
        }
      );
    } else {
      setIsExpanded(true);
    }
  };

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const h = event.nativeEvent.layout.height;
      if (isExpanded && h > COLLAPSED_HEIGHT) {
        setExpandedHeight(h);
        contentHeight.value = withSpring(h, SPRING_CONFIG);
      }
    },
    [isExpanded]
  );

  const animatedContentStyle = useAnimatedStyle(() => ({
    overflow: 'hidden' as const,
    maxHeight: contentHeight.value,
  }));

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

      <Animated.View style={[styles.content, animatedContentStyle]}>
        <View onLayout={handleContentLayout}>
          <Text style={styles.title} numberOfLines={3}>
            {item.title}
          </Text>
          <Text style={styles.snippet}>{displayText}</Text>
          {isTruncatable && (
            <TouchableOpacity
              onPress={toggleExpand}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.showMoreTouchable}
            >
              <Text style={styles.showMoreText}>
                {isExpanded || isAnimatingCollapse ? 'show less' : 'show more'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.source}>{item.source}</Text>
        </View>
      </Animated.View>

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
  source: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
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
