import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { CoinTableView } from '../components/CoinTableView';
import { ViewToggle } from '../components/ViewToggle';
import { SearchBar } from '../components/SearchBar';
import { useAppStore } from '../state/useAppStore';
import { fetchTrendingCoins, search } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { colors, spacing } from '../theme/theme';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

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

  const categories: ExploreCategory[] = ['trending', 'top', 'nft', 'defi'];

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

  const loadData = useCallback(async () => {
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
  }, [exploreCategory]);

  // Keep market list actively synced from backend while not searching.
  usePollingEffect(
    loadData,
    [loadData, searchQuery],
    { enabled: searchQuery.trim().length === 0, intervalMs: 20000, immediate: true }
  );

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

  // Filter coins based on category (for nft/defi, we use all coins since backend doesn't have specific endpoints)
  const filteredCoins = exploreCategory === 'trending' || exploreCategory === 'top'
    ? coins
    : coins; // For nft/defi, show all coins (could be enhanced later)
  const isSearching = searchResults !== null;
  const visibleCoins = isSearching ? searchResults.coins : filteredCoins;
  const visibleSymbols = visibleCoins.map((c) => c.symbol);
  const { quotes } = useMarketPriceStream(visibleSymbols);
  const liveVisibleCoins = visibleCoins.map((coin) => {
    const q = quotes[coin.symbol.toUpperCase()];
    if (!q) return coin;
    return {
      ...coin,
      price: Number.isFinite(q.price) ? q.price : coin.price,
      change24h: Number.isFinite(q.percentChange24h) ? q.percentChange24h : coin.change24h,
    };
  });

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search coins, tokens..."
      />
      <MarketCapPlaceholder />
      {!isSearching && (
        <FilterPills
          categories={categories}
          selectedCategory={exploreCategory}
          onSelect={setExploreCategory}
        />
      )}
      <View style={styles.toggleRow}>
        <ViewToggle selectedView={viewMode} onSelect={setViewMode} />
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}
    </View>
  );

  // If searching, show search results
  if (isSearching) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {viewMode === 'table' ? (
          <ScrollView style={styles.tableContainer}>
            <CoinTableView coins={liveVisibleCoins} onCoinPress={handleCoinPress} />
          </ScrollView>
        ) : (
          <FlatList
            data={liveVisibleCoins}
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
            <CoinTableView coins={liveVisibleCoins} onCoinPress={handleCoinPress} />
          )}
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={loading && coins.length === 0 ? Array(5).fill(null) : liveVisibleCoins}
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
      {renderHeader()}
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
    backgroundColor: colors.neutral[50],
    paddingBottom: spacing.xs,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error[500],
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryText: {
    color: colors.primary[500],
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorBanner: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    marginHorizontal: 24,
    marginTop: spacing.xs,
    borderRadius: 16,
  },
  errorBannerText: {
    color: colors.error[700],
    fontSize: 14,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.neutral[500],
    fontSize: 16,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 96,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: spacing.xs,
  },
  skeletonContainer: {
    paddingTop: spacing.xs,
    paddingBottom: 96,
  },
  toggleRow: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
});
