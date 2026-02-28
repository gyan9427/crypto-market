import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FilterPills } from '../components/FilterPills';
import { MarketCapChart } from '../charts';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { LivePriceTrendingCoinCard } from '../components/LivePriceTrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { CoinTableView } from '../components/CoinTableView';
import { ViewToggle } from '../components/ViewToggle';
import { SearchBar } from '../components/SearchBar';
import { useAppStore } from '../state/useAppStore';
import { fetchActiveCoinsPage, search } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { ExploreCategory, TrendingCoin } from '../types';
import { colors } from '../theme/theme';

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<{ coins: TrendingCoin[] } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);
  const visibleSymbols = useMemo(() => {
    const fromCoins = coins.map((c) => c.symbol).filter(Boolean);
    if (searchResults?.coins?.length) {
      const fromSearch = searchResults.coins.map((c) => c.symbol).filter(Boolean);
      return [...new Set([...fromCoins, ...fromSearch])];
    }
    return fromCoins;
  }, [coins, searchResults]);
  const { prices: livePrices } = useMarketPrices(visibleSymbols);

  const categories: ExploreCategory[] = ['trending', 'top', 'nft', 'defi'];

  const mergeLivePrices = useCallback(
    (coin: TrendingCoin): TrendingCoin => {
      const key = coin.symbol?.toUpperCase();
      const live = key ? livePrices.get(key) : undefined;
      if (live) {
        return { ...coin, price: live.price, change24h: live.percentChange24h };
      }
      return coin;
    },
    [livePrices]
  );

  const categoryMap: Record<ExploreCategory, 'trending' | 'top' | 'nft' | 'defi'> = {
    trending: 'trending',
    top: 'top',
    nft: 'trending',
    defi: 'trending',
  };

  const loadInitialPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCoins([]);
      setNextCursor(undefined);
      const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
        undefined,
        20,
        categoryMap[exploreCategory]
      );
      setCoins(pageCoins);
      setNextCursor(cursor);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [exploreCategory]);

  const loadMore = useCallback(async () => {
    if (loadingMore || nextCursor === null || nextCursor === undefined) return;
    try {
      setLoadingMore(true);
      const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
        nextCursor,
        20,
        categoryMap[exploreCategory]
      );
      setCoins((prev) => [...prev, ...pageCoins]);
      setNextCursor(cursor);
    } catch (err: any) {
      console.error('Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, exploreCategory]);

  useEffect(() => {
    loadInitialPage();
  }, [loadInitialPage]);

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
        <Text style={styles.retryText} onPress={loadInitialPage}>
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
            <MarketCapChart />
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

  // Table and list use base coins; LivePriceCell/LiveChangeCell and LivePriceTrendingCoinCard read from store for granular updates
  const displayCoins = useMemo(() => coins, [coins]);

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
            <CoinTableView
              coins={displayCoins}
              onCoinPress={handleCoinPress}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              hasMore={nextCursor != null}
              loadingMore={loadingMore}
            />
          )}
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={loading && coins.length === 0 ? Array(5).fill(null) : displayCoins}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        renderItem={({ item, index }) => {
          if (loading && coins.length === 0) {
            return <TrendingCoinCardSkeleton key={`skeleton-${index}`} />;
          }
          return <LivePriceTrendingCoinCard coin={item} onPress={handleCoinPress} />;
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : null
        }
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
          <MarketCapChart />
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
