import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { openInAppBrowser } from '../utils/browser';
import { X, Share2, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { NewsItem, ReactionType } from '../types';
import { CoinChip } from '../components/CoinChip';
import { ReactionPicker } from '../components/ReactionPicker';
import { SaveToBoardModal } from '../components/SaveToBoardModal';
import { formatDateTime } from '../utils/format';
import { coinsHeaderPrimaryLine } from '../components/news/newsCardUtils';
import { toggleReaction } from '../services/api';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAppStore } from '../state/useAppStore';
import { shareNewsItem } from '../utils/share';

interface NewsDetailModalProps {
  newsItem: NewsItem;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  newsItem,
  onClose,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildNewsDetailModalStyles(tokens), [tokens]);
  const c = tokens.colors;
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(newsItem.isSaved ?? false);
  const [saveCount, setSaveCount] = useState(newsItem.saveCount ?? 0);
  const [saveBoardOpen, setSaveBoardOpen] = useState(false);
  const [reactions, setReactions] = useState(newsItem.reactions);
  const [userReaction, setUserReaction] = useState(newsItem.userReaction ?? null);
  const isSavedToAnyBoard = useAppStore((s) => s.isSavedToAnyBoard);
  const storeSetReaction = useAppStore((s) => s.setReaction);

  const handleReact = async (type: ReactionType) => {
    const prevReaction = userReaction;
    const nextReaction = prevReaction === type ? null : type;
    const prevCounts = reactions;

    const optimisticCounts = { ...(reactions ?? { appreciate: 0, insightful: 0, bullish: 0, risk: 0, deepDive: 0, debatable: 0, total: 0 }) };
    if (prevReaction) {
      optimisticCounts[prevReaction] = Math.max(0, (optimisticCounts[prevReaction] ?? 0) - 1);
      optimisticCounts.total = Math.max(0, optimisticCounts.total - 1);
    }
    if (nextReaction) {
      optimisticCounts[nextReaction] = (optimisticCounts[nextReaction] ?? 0) + 1;
      optimisticCounts.total = optimisticCounts.total + 1;
    }

    setUserReaction(nextReaction);
    setReactions(optimisticCounts);
    storeSetReaction(newsItem.id, nextReaction);
    try {
      const result = await toggleReaction(newsItem.id, type);
      setUserReaction(result.userReaction);
      setReactions(result.reactions);
      storeSetReaction(newsItem.id, result.userReaction);
    } catch {
      setUserReaction(prevReaction);
      setReactions(prevCounts);
      storeSetReaction(newsItem.id, prevReaction);
    }
  };

  const handleSaved = (_newsId: string, count: number) => {
    setIsSaved(true);
    setSaveCount(count);
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.surface }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color={c.neutral[800]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {newsItem.imageUrl ? (
          <Image
            source={{ uri: newsItem.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroPlaceholder} accessibilityLabel="No article image">
            <Text style={styles.heroPlaceholderText}>
              {(newsItem.coins[0]?.symbol?.[0] ?? newsItem.coins[0]?.name?.[0] ?? 'N').toUpperCase()}
            </Text>
          </View>
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
              accessibilityLabel={t('accessibility.shareArticle')}
              onPress={() => {
                void shareNewsItem(newsItem);
              }}
            >
              <Share2 size={20} color={c.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Saved' : 'Save article'}
              onPress={() => setSaveBoardOpen(true)}
            >
              {isSaved || isSavedToAnyBoard(newsItem.id) ? (
                <BookmarkCheck size={20} color={c.primary[500]} />
              ) : (
                <Bookmark size={20} color={c.neutral[500]} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{newsItem.title}</Text>

          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {newsItem.coins.length > 0
                ? coinsHeaderPrimaryLine(newsItem.coins)
                : formatDateTime(newsItem.publishedAt)}
              {newsItem.coins.length > 0 ? ` • ${formatDateTime(newsItem.publishedAt)}` : ''}
            </Text>
            {newsItem.author && (
              <Text style={styles.metaText}>{t('news.byAuthor', { author: newsItem.author })}</Text>
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
              <Text style={styles.sectionTitle}>{t('news.relatedCoins')}</Text>
              <View style={styles.coinsRow}>
                {newsItem.coins.map((coin) => (
                  <CoinChip key={coin.id} coin={coin} />
                ))}
              </View>
            </View>
          )}

          {newsItem.relatedCoins && newsItem.relatedCoins.length > 0 && (
            <View style={styles.coinsSection}>
              <Text style={styles.sectionTitle}>{t('news.relatedTickers')}</Text>
              <View style={styles.relatedTickersRow}>
                {newsItem.relatedCoins.map((coinId) => (
                  <TouchableOpacity
                    key={coinId}
                    style={styles.relatedTickerBadge}
                    onPress={() => router.push(`/coins/${coinId}` as never)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.relatedTickerText}>{coinId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.bodyText}>
            {newsItem.content ?? newsItem.subtitle ?? newsItem.snippet}
          </Text>

          {(newsItem.url || newsItem.sourceUrl) && (
            <TouchableOpacity
              style={styles.readFullButton}
              onPress={() =>
                openInAppBrowser(newsItem.url || newsItem.sourceUrl!, {
                  barTintColor: c.neutral[900],
                })
              }
            >
              <Text style={styles.readFullButtonText}>{t('news.readFullArticle')}</Text>
            </TouchableOpacity>
          )}

          {saveCount > 0 && (
            <Text style={styles.saveCountText}>
              {t('news.saveCount', { count: saveCount })}
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

function buildNewsDetailModalStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: s.md,
    paddingTop: s.xl,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: c.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: c.neutral[200],
  },
  heroPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: c.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: c.neutral[500],
  },
  content: {
    padding: s.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: s.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: s.sm,
    backgroundColor: c.neutral[100],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: tokens.text,
    lineHeight: 32,
    marginBottom: s.md,
  },
  meta: {
    marginBottom: s.lg,
  },
  metaText: {
    fontSize: 13,
    color: tokens.textMuted,
    marginBottom: 4,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: s.lg,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: c.primary[100],
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary[700],
  },
  coinsSection: {
    marginBottom: s.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.neutral[800],
    marginBottom: s.sm,
  },
  coinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  relatedTickersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedTickerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF08A',
  },
  relatedTickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#854D0E',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: tokens.textMuted,
    marginBottom: s.lg,
  },
  readFullButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: br.md,
    backgroundColor: c.primary[500],
  },
  readFullButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  saveCountText: {
    marginTop: s.md,
    fontSize: 13,
    color: tokens.textMuted,
    textAlign: 'center',
  },
});
}
