import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { MarketCapSkeleton } from '../components/MarketCapSkeleton';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { CoinTableView } from '../components/CoinTableView';
import { ViewToggle } from '../components/ViewToggle';
import { SearchBar } from '../components/SearchBar';
import { useAppStore } from '../state/useAppStore';
import { fetchTrendingCoins, search } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { ExploreCategory, TrendingCoin } from '../types';
import { colors } from '../theme/theme';

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [searchResults, setSearchResults] = useState<{ coins: TrendingCoin[] } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);
  const { prices: livePrices, isConnected } = useMarketPrices();
  void isConnected; // consumed to avoid unused var; connection status not displayed

  const categories: ExploreCategory[] = ['trending', 'top', 'nft', 'defi'];

  const mergeLivePrices = useCallback(
    (coin: TrendingCoin): TrendingCoin => {
      const live = livePrices.get(coin.symbol);
      if (live) {
        return { ...coin, price: live.price, change24h: live.percentChange24h };
      }
      return coin;
    },
    [livePrices]
  );

  const coinsWithLivePrices = useMemo(
    () => coins.map(mergeLivePrices),
    [coins, mergeLivePrices]
  );

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
    router.push(`/coin/${coinId}` as never);
  };

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

  const searchResultsWithLivePrices = useMemo(
    () =>
      searchResults
        ? { ...searchResults, coins: searchResults.coins.map(mergeLivePrices) }
        : null,
    [searchResults, mergeLivePrices]
  );

  // If searching, show search results
  if (searchResultsWithLivePrices !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search coins, tokens..."
          />
          <View style={styles.headerRow}>
            <MarketCapPlaceholder />
        </View>
        <ViewToggle selectedView={viewMode} onSelect={setViewMode} />
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </View>
        {viewMode === 'table' ? (
          <ScrollView style={styles.tableContainer}>
            <CoinTableView coins={searchResultsWithLivePrices.coins} onCoinPress={handleCoinPress} />
          </ScrollView>
        ) : (
          <FlatList
            data={searchResultsWithLivePrices.coins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TrendingCoinCard coin={item} onPress={handleCoinPress} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  // Filter coins based on category (for nft/defi, we use all coins since backend doesn't have specific endpoints)
  const filteredCoins = exploreCategory === 'trending' || exploreCategory === 'top'
    ? coinsWithLivePrices
    : coinsWithLivePrices; // For nft/defi, show all coins (could be enhanced later)

  const renderContent = () => {
    if (viewMode === 'table') {
      return (
        <ScrollView style={styles.tableContainer}>
          {loading && coins.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {Array(5).fill(null).map((_, index) => (
                <TrendingCoinCardSkeleton key={`skeleton-${index}`} />
              ))}
            </View>
          ) : (
            <CoinTableView coins={filteredCoins} onCoinPress={handleCoinPress} />
          )}
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={loading && coins.length === 0 ? Array(5).fill(null) : filteredCoins}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        renderItem={({ item, index }) => {
          if (loading && coins.length === 0) {
            return <TrendingCoinCardSkeleton key={`skeleton-${index}`} />;
          }
          return <TrendingCoinCard coin={item} onPress={handleCoinPress} />;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search coins, tokens..."
        />
        <View style={styles.headerRow}>
          {loading && coins.length === 0 ? (
            <MarketCapSkeleton />
          ) : (
            <MarketCapPlaceholder />
          )}
        </View>
        <FilterPills
          categories={categories}
          selectedCategory={exploreCategory}
          onSelect={setExploreCategory}
        />
        <ViewToggle selectedView={viewMode} onSelect={setViewMode} />
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  headerSection: {
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingTop: 8,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonContainer: {
    paddingTop: 8,
    paddingBottom: 100,
  },
});
