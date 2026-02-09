import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { SearchBar } from '../components/SearchBar';
import { useAppStore } from '../state/useAppStore';
import { fetchTrendingCoins, search } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { colors } from '../theme/theme';

export const ExploreScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [searchResults, setSearchResults] = useState<{ coins: TrendingCoin[] } | null>(null);

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);

  const categories: ExploreCategory[] = ['trending', 'top', 'nft', 'defi'];

  // Load data when category changes
  useEffect(() => {
    loadData();
  }, [exploreCategory]);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trending coins based on category
      const categoryMap: Record<ExploreCategory, 'trending' | 'top' | 'nft' | 'defi'> = {
        trending: 'trending',
        top: 'top',
        nft: 'trending', // Use trending as fallback
        defi: 'trending', // Use trending as fallback
      };

      const trendingCoins = await fetchTrendingCoins(categoryMap[exploreCategory]);
      setCoins(trendingCoins);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const results = await search(query);
      setSearchResults({
        coins: results.coins.map((coin) => ({
          ...coin,
          rank: 0, // Search results don't have rank
          category: exploreCategory,
        })) as TrendingCoin[],
      });
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchResults({ coins: [] });
    }
  };

  const handleCoinPress = (coinId: string) => {
    // TODO: Implement navigation to coin detail
    console.log('Open coin detail:', coinId);
  };


  if (loading && coins.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error && coins.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={loadData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // If searching, show search results
  if (searchResults !== null) {
    return (
      <View style={styles.container}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search coins, tokens..."
        />
        <FlatList
          data={searchResults.coins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrendingCoinCard coin={item} onPress={handleCoinPress} />
          )}
          ListHeaderComponent={
            <>
              <MarketCapPlaceholder />
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // Filter coins based on category (for nft/defi, we use all coins since backend doesn't have specific endpoints)
  const filteredCoins = exploreCategory === 'trending' || exploreCategory === 'top'
    ? coins
    : coins; // For nft/defi, show all coins (could be enhanced later)

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCoins}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrendingCoinCard coin={item} onPress={handleCoinPress} />
        )}
        ListHeaderComponent={
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search coins, tokens..."
            />
            <MarketCapPlaceholder />
            <FilterPills
              categories={categories}
              selectedCategory={exploreCategory}
              onSelect={setExploreCategory}
            />
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  loadingText: {
    marginTop: 16,
    color: colors.neutral[600],
    fontSize: 16,
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
    paddingHorizontal: 16,
  },
});
