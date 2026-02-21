import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { openInAppBrowser } from '../utils/browser';
import { X, Share2, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { NewsItem, ReactionType } from '../types';
import { CoinChip } from '../components/CoinChip';
import { ReactionPicker } from '../components/ReactionPicker';
import { SaveToBoardModal } from '../components/SaveToBoardModal';
import { formatDateTime } from '../utils/format';
import { toggleReaction } from '../services/api';
import { colors, spacing, borderRadius } from '../theme/theme';
import { useAppStore } from '../state/useAppStore';

interface NewsDetailModalProps {
  newsItem: NewsItem;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  newsItem,
  onClose,
}) => {
  const [isSaved, setIsSaved] = useState(newsItem.isSaved ?? false);
  const [saveCount, setSaveCount] = useState(newsItem.saveCount ?? 0);
  const [saveBoardOpen, setSaveBoardOpen] = useState(false);
  const [reactions, setReactions] = useState(newsItem.reactions);
  const [userReaction, setUserReaction] = useState(newsItem.userReaction ?? null);
  const isSavedToAnyBoard = useAppStore((s) => s.isSavedToAnyBoard);
  const storeSetReaction = useAppStore((s) => s.setReaction);

  const handleReact = async (type: ReactionType) => {
    const prev = userReaction;
    const optimistic = prev === type ? null : type;
    setUserReaction(optimistic);
    storeSetReaction(newsItem.id, optimistic);
    try {
      const result = await toggleReaction(newsItem.id, type);
      setUserReaction(result.userReaction);
      setReactions(result.reactions);
      storeSetReaction(newsItem.id, result.userReaction);
    } catch {
      setUserReaction(prev);
      storeSetReaction(newsItem.id, prev);
    }
  };

  const handleSaved = (_newsId: string, count: number) => {
    setIsSaved(true);
    setSaveCount(count);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {newsItem.imageUrl && (
          <Image
            source={{ uri: newsItem.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.actionsRow}>
            <ReactionPicker
              reactions={reactions}
              userReaction={userReaction}
              onReact={handleReact}
            />

            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Share article"
              onPress={() => {
                console.log('Share article:', newsItem.id);
              }}
            >
              <Share2 size={20} color={colors.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Saved' : 'Save article'}
              onPress={() => setSaveBoardOpen(true)}
            >
              {isSaved || isSavedToAnyBoard(newsItem.id) ? (
                <BookmarkCheck size={20} color={colors.primary[500]} />
              ) : (
                <Bookmark size={20} color={colors.neutral[500]} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{newsItem.title}</Text>

          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {newsItem.source} • {formatDateTime(newsItem.publishedAt)}
            </Text>
            {newsItem.author && (
              <Text style={styles.metaText}>By {newsItem.author}</Text>
            )}
          </View>

          {newsItem.categories && newsItem.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {newsItem.categories.map((cat) => (
                <View key={cat.key} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                </View>
              ))}
            </View>
          )}

          {newsItem.coins.length > 0 && (
            <View style={styles.coinsSection}>
              <Text style={styles.sectionTitle}>Related Coins</Text>
              <View style={styles.coinsRow}>
                {newsItem.coins.map((coin) => (
                  <CoinChip key={coin.id} coin={coin} />
                ))}
              </View>
            </View>
          )}

          <Text style={styles.bodyText}>
            {newsItem.subtitle || newsItem.content || newsItem.snippet}
          </Text>

          {(newsItem.url || newsItem.sourceUrl) && (
            <TouchableOpacity
              style={styles.readFullButton}
              onPress={() => openInAppBrowser(newsItem.url || newsItem.sourceUrl!)}
            >
              <Text style={styles.readFullButtonText}>Read full article</Text>
            </TouchableOpacity>
          )}

          {saveCount > 0 && (
            <Text style={styles.saveCountText}>
              {saveCount} {saveCount === 1 ? 'person has' : 'people have'} saved this article
            </Text>
          )}
        </View>
      </ScrollView>

      <SaveToBoardModal
        visible={saveBoardOpen}
        newsId={newsItem.id}
        onClose={() => setSaveBoardOpen(false)}
        onSaved={handleSaved}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.neutral[200],
  },
  content: {
    padding: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.neutral[100],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  meta: {
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: 13,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  coinsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  coinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.neutral[700],
    marginBottom: spacing.lg,
  },
  readFullButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
  },
  readFullButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  saveCountText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
