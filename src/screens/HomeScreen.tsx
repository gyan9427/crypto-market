import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text } from 'react-native';
import { SegmentToggle } from '../components/SegmentToggle';
import { SearchBar } from '../components/SearchBar';
import { NewsCard } from '../components/NewsCard';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FeaturedCarouselSkeleton } from '../components/FeaturedCarouselSkeleton';
import { NewsCardSkeleton } from '../components/NewsCardSkeleton';
import { useAppStore } from '../state/useAppStore';
import { fetchNews, search } from '../services/api';
import { NewsItem } from '../types';
import { colors } from '../theme/theme';

export const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);

  const feedFilter = useAppStore((state) => state.feedFilter);
  const setFeedFilter = useAppStore((state) => state.setFeedFilter);
  const toggleLike = useAppStore((state) => state.toggleLike);
  const toggleSave = useAppStore((state) => state.toggleSave);
  const likedNews = useAppStore((state) => state.likedNews);
  const savedNews = useAppStore((state) => state.savedNews);

  // Fetch news when filter changes
  useEffect(() => {
    loadNews();
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
      const news = await fetchNews(feedFilter, 1, 50);
      
      // Merge with app store state for likes/saves
      const newsWithState = news.map((item) => ({
        ...item,
        isLiked: likedNews.includes(item.id),
        isSaved: savedNews.includes(item.id),
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
        isLiked: likedNews.includes(item.id),
        isSaved: savedNews.includes(item.id),
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

  const handleLike = (newsId: string) => {
    toggleLike(newsId);
    // Update local state
    setNewsData((prev) =>
      prev.map((item) =>
        item.id === newsId ? { ...item, isLiked: !item.isLiked } : item
      )
    );
    if (searchResults) {
      setSearchResults((prev) =>
        prev?.map((item) =>
          item.id === newsId ? { ...item, isLiked: !item.isLiked } : item
        ) || null
      );
    }
  };

  const handleSave = (newsId: string) => {
    toggleSave(newsId);
    // Update local state
    setNewsData((prev) =>
      prev.map((item) =>
        item.id === newsId ? { ...item, isSaved: !item.isSaved } : item
      )
    );
    if (searchResults) {
      setSearchResults((prev) =>
        prev?.map((item) =>
          item.id === newsId ? { ...item, isSaved: !item.isSaved } : item
        ) || null
      );
    }
  };

  const handleComment = (newsId: string) => {
    // TODO: Implement navigation to comments
    console.log('Comment on:', newsId);
  };

  const handleShare = (newsId: string) => {
    // TODO: Implement share functionality
    console.log('Share:', newsId);
  };

  const handleNewsPress = (newsId: string) => {
    // TODO: Implement navigation to news detail
    console.log('Open news detail:', newsId);
  };

  const handleFeaturedNewsPress = (newsId: string) => {
    // TODO: Implement navigation to news detail
    console.log('Open featured news detail:', newsId);
  };

  const handleCoinPress = (coinId: string) => {
    // TODO: Implement navigation to coin detail
    console.log('Open coin detail:', coinId);
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
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onPress={handleNewsPress}
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
});
