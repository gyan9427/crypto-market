import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SegmentToggle } from '../components/SegmentToggle';
import { SearchBar } from '../components/SearchBar';
import { NewsCard } from '../components/NewsCard';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FeaturedCarouselSkeleton } from '../components/FeaturedCarouselSkeleton';
import { NewsCardSkeleton } from '../components/NewsCardSkeleton';
import { SaveToBoardModal } from '../components/SaveToBoardModal';
import { CommentTray } from '../components/CommentTray';
import { useAppStore } from '../state/useAppStore';
import { fetchNews, toggleReaction } from '../services/api';
import { NewsItem, ReactionType } from '../types';
import { NewsDetailModal } from './NewsDetailModal';
import { colors, spacing, semantic } from '../theme/theme';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);

  const feedFilter = useAppStore((state) => state.feedFilter);
  const setFeedFilter = useAppStore((state) => state.setFeedFilter);
  const setReaction = useAppStore((state) => state.setReaction);
  const newsReactions = useAppStore((state) => state.newsReactions);
  const isSavedToAnyBoard = useAppStore((state) => state.isSavedToAnyBoard);

  // Fetch news when filter or categories change
  useEffect(() => {
    loadNews();
  }, [feedFilter, selectedCategories]);

  // Featured section only depends on feed filter
  useEffect(() => {
    loadFeaturedNews();
  }, [feedFilter]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch a full page of news items from the backend (up to 50)
      const news = await fetchNews(feedFilter, 1, 50, selectedCategories);
      
      const newsWithState = news.map((item) => ({
        ...item,
        userReaction: newsReactions[item.id] ?? item.userReaction ?? null,
        isSaved: isSavedToAnyBoard(item.id),
      }));
      
      setNewsData(newsWithState);
    } catch (err: any) {
      setError(err.message || 'Failed to load news');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedNews = async () => {
    try {
      const news = await fetchNews('explore', 1, 3); // Get 3 featured news items
      setFeaturedNews(news.slice(0, 3));
    } catch (err: any) {
      console.error('Error loading featured news:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const handleSegmentChange = useCallback((index: number) => {
    setFeedFilter(index === 0 ? 'following' : 'explore');
  }, [setFeedFilter]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleReact = useCallback(async (newsId: string, type: ReactionType) => {
    const currentReaction = newsReactions[newsId] ?? null;
    const newReaction = currentReaction === type ? null : type;
    setReaction(newsId, newReaction);

    const optimisticUpdate = (item: NewsItem): NewsItem => {
      if (item.id !== newsId) return item;
      const prev = { ...(item.reactions ?? { appreciate: 0, insightful: 0, bullish: 0, risk: 0, deepDive: 0, debatable: 0, total: 0 }) };
      if (currentReaction) {
        prev[currentReaction] = Math.max(0, (prev[currentReaction] ?? 0) - 1);
        prev.total = Math.max(0, prev.total - 1);
      }
      if (newReaction) {
        prev[newReaction] = (prev[newReaction] ?? 0) + 1;
        prev.total = prev.total + 1;
      }
      return { ...item, userReaction: newReaction, reactions: prev };
    };

    setNewsData((prev) => prev.map(optimisticUpdate));

    try {
      const result = await toggleReaction(newsId, type);
      setReaction(newsId, result.userReaction);
      const applyServer = (items: NewsItem[]) =>
        items.map((item) =>
          item.id === newsId
            ? { ...item, reactions: result.reactions, userReaction: result.userReaction }
            : item
        );
      setNewsData((prev) => applyServer(prev));
    } catch (error) {
      setReaction(newsId, currentReaction);
      setNewsData((prev) =>
        prev.map((item) =>
          item.id === newsId ? { ...item, userReaction: currentReaction } : item
        )
      );
      console.error('Failed to toggle reaction:', error);
    }
  }, [newsReactions, setReaction]);

  const handleSave = useCallback((newsId: string) => {
    setSavingNewsId(newsId);
  }, []);

  const handleSaved = useCallback((newsId: string, saveCount: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, isSaved: true, saveCount } : item;
    setNewsData((prev) => prev.map(update));
    setSavingNewsId(null);
  }, []);

  const handleComment = useCallback((newsId: string) => {
    setCommentingNewsId(newsId);
  }, []);

  const handleCommentCountChange = useCallback((newsId: string, count: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, comments: count } : item;
    setNewsData((prev) => prev.map(update));
  }, []);

  const handleShare = useCallback((newsId: string) => {
    // TODO: Implement share functionality
    console.log('Share:', newsId);
  }, []);

  const openNewsDetailById = useCallback((newsId: string) => {
    const allNewsSources: NewsItem[] = [
      ...newsData,
      ...featuredNews,
    ];

    const newsItem = allNewsSources.find((item) => item.id === newsId);
    if (!newsItem) {
      return;
    }

    const dummyBody =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum at magna euismod, consectetur nibh at, sollicitudin tortor. ' +
      'Integer finibus, nibh vel tempor placerat, nunc sem pretium sapien, vel pulvinar nisi justo non urna.\n\n' +
      'Suspendisse potenti. Morbi non magna eget elit gravida hendrerit. Donec aliquam, nisl in dictum sagittis, ' +
      'lectus lorem pulvinar enim, quis hendrerit dui nunc sit amet metus. This is placeholder copy used while the full article integration is in progress.';

    setSelectedNews({
      ...newsItem,
      content: newsItem.content || `${newsItem.snippet}\n\n${dummyBody}`,
    });
    setIsDetailVisible(true);
  }, [newsData, featuredNews]);

  const handleFeaturedNewsPress = useCallback((newsId: string) => {
    openNewsDetailById(newsId);
  }, [openNewsDetailById]);

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  }, []);

  const handleCoinPress = useCallback((coinId: string) => {
    router.push(`/coins/${coinId}` as never);
  }, [router]);

  const displayData = newsData;

  const handleSearchPress = useCallback(() => {
    router.push('/search?segment=all' as never);
  }, [router]);

  const listHeaderComponent = useMemo(
    () => (
      <>
        <SearchBar
          value=""
          onChangeText={() => {}}
          editable={false}
          onPress={handleSearchPress}
          placeholder="Search news, coins..."
        />
        {loading && newsData.length === 0 ? (
          <FeaturedCarouselSkeleton />
        ) : (
          featuredNews.length > 0 && (
            <FeaturedCarousel items={featuredNews} onItemPress={handleFeaturedNewsPress} />
          )
        )}
        <SegmentToggle
          options={['Following', 'Explore']}
          selectedIndex={feedFilter === 'following' ? 0 : 1}
          onSelect={handleSegmentChange}
        />
        <View style={styles.categoryFilterRow}>
          {['BTC', 'ETH', 'FIAT', 'MARKET', 'CRYPTOCURRENCY'].map((cat) => {
            const isActive = selectedCategories.includes(cat);
            return (
              <Text
                key={cat}
                onPress={() => toggleCategory(cat)}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
              >
                {cat}
              </Text>
            );
          })}
        </View>
        {error && newsData.length > 0 && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </>
    ),
    [
      loading,
      newsData.length,
      featuredNews,
      selectedCategories,
      error,
      feedFilter,
      handleSearchPress,
      handleFeaturedNewsPress,
      handleSegmentChange,
      toggleCategory,
    ]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: NewsItem | null; index: number }) => {
      if (loading && newsData.length === 0) {
        return <NewsCardSkeleton key={`skeleton-${index}`} />;
      }
      return (
        <NewsCard
          item={item!}
          onReact={handleReact}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
          onCoinPress={handleCoinPress}
        />
      );
    },
    [loading, newsData.length, handleReact, handleComment, handleShare, handleSave, handleCoinPress]
  );

  if (error && newsData.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={loadNews}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loading && newsData.length === 0 ? Array(5).fill(null) : displayData}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        renderItem={renderItem}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={
          !loading && displayData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {selectedNews && (
        <Modal
          visible={isDetailVisible}
          animationType="slide"
          onRequestClose={handleCloseDetail}
        >
          <NewsDetailModal newsItem={selectedNews} onClose={handleCloseDetail} />
        </Modal>
      )}

      <SaveToBoardModal
        visible={savingNewsId !== null}
        newsId={savingNewsId}
        onClose={() => setSavingNewsId(null)}
        onSaved={handleSaved}
      />

      <CommentTray
        visible={commentingNewsId !== null}
        newsId={commentingNewsId}
        commentCount={
          commentingNewsId
            ? (displayData.find((n) => n?.id === commentingNewsId)?.comments ?? 0)
            : 0
        }
        onClose={() => setCommentingNewsId(null)}
        onCountChange={handleCommentCountChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error[500],
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Manrope_500Medium',
  },
  retryText: {
    color: colors.primary[500],
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: 'JetBrainsMono_500Medium',
  },
  errorBanner: {
    backgroundColor: colors.error[50],
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  errorBannerText: {
    color: colors.error[700],
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.neutral[500],
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.surface.base,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    fontFamily: 'JetBrainsMono_500Medium',
  },
  categoryPillActive: {
    backgroundColor: colors.surface.tintedPrimary,
    borderColor: colors.border.primary,
    color: colors.primary[700],
  },
});
