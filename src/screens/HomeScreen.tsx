import React, { useState, useEffect } from 'react';
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
import { fetchNews, search, toggleReaction } from '../services/api';
import { NewsItem, ReactionType } from '../types';
import { NewsDetailModal } from './NewsDetailModal';
import { colors } from '../theme/theme';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
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

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

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

  const handleSearch = async (query: string) => {
    try {
      const results = await search(query);
      const newsWithState = results.news.map((item) => ({
        ...item,
        userReaction: newsReactions[item.id] ?? item.userReaction ?? null,
        isSaved: isSavedToAnyBoard(item.id),
      }));
      setSearchResults(newsWithState);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const handleSegmentChange = (index: number) => {
    setFeedFilter(index === 0 ? 'following' : 'explore');
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleReact = async (newsId: string, type: ReactionType) => {
    const currentReaction = newsReactions[newsId] ?? null;
    const newReaction = currentReaction === type ? null : type;
    setReaction(newsId, newReaction);

    const updateItems = (items: NewsItem[]) =>
      items.map((item) =>
        item.id === newsId ? { ...item, userReaction: newReaction } : item
      );
    setNewsData((prev) => updateItems(prev));
    if (searchResults) {
      setSearchResults((prev) => prev ? updateItems(prev) : null);
    }

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
      if (searchResults) {
        setSearchResults((prev) => prev ? applyServer(prev) : null);
      }
    } catch (error) {
      setReaction(newsId, currentReaction);
      setNewsData((prev) =>
        prev.map((item) =>
          item.id === newsId ? { ...item, userReaction: currentReaction } : item
        )
      );
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleSave = (newsId: string) => {
    setSavingNewsId(newsId);
  };

  const handleSaved = (newsId: string, saveCount: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, isSaved: true, saveCount } : item;
    setNewsData((prev) => prev.map(update));
    setSearchResults((prev) => prev?.map(update) || null);
    setSavingNewsId(null);
  };

  const handleComment = (newsId: string) => {
    setCommentingNewsId(newsId);
  };

  const handleCommentCountChange = (newsId: string, count: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, comments: count } : item;
    setNewsData((prev) => prev.map(update));
    setSearchResults((prev) => prev?.map(update) || null);
  };

  const handleShare = (newsId: string) => {
    // TODO: Implement share functionality
    console.log('Share:', newsId);
  };

  const openNewsDetailById = (newsId: string) => {
    const allNewsSources: NewsItem[] = [
      ...newsData,
      ...(searchResults || []),
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
  };

  const handleNewsPress = (newsId: string) => {
    openNewsDetailById(newsId);
  };

  const handleFeaturedNewsPress = (newsId: string) => {
    openNewsDetailById(newsId);
  };

  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  };

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin/${coinId}` as never);
  };

  const displayData = searchResults !== null ? searchResults : newsData;

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
        renderItem={({ item, index }) => {
          if (loading && newsData.length === 0) {
            return <NewsCardSkeleton key={`skeleton-${index}`} />;
          }
          return (
            <NewsCard
              item={item}
              onReact={handleReact}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onCoinPress={handleCoinPress}
            />
          );
        }}
        ListHeaderComponent={
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
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
        }
        ListEmptyComponent={
          !loading && searchResults !== null && searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={50}
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
  },
  retryText: {
    color: colors.primary[500],
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorBanner: {
    backgroundColor: colors.error[50],
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    color: colors.error[700],
    fontSize: 14,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.neutral[500],
    fontSize: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    fontSize: 12,
    color: colors.neutral[700],
  },
  categoryPillActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    color: colors.primary[700],
  },
});
