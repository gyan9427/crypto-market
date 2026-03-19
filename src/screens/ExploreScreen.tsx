import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { CoinTableView } from '../components/CoinTableView';
import { ViewToggle } from '../components/ViewToggle';
import { SearchBar } from '../components/SearchBar';
import { useAppStore } from '../state/useAppStore';
import { fetchTrendingCoins } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { colors, spacing } from '../theme/theme';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [searchPreview, setSearchPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);

  const categories: ExploreCategory[] = ['trending', 'top', 'nft', 'defi'];

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
    [loadData, isFocused],
    { enabled: isFocused, intervalMs: 20000, immediate: true }
  );

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin/${coinId}` as never);
  };

  // Filter coins based on category (for nft/defi, we use all coins since backend doesn't have specific endpoints)
  const filteredCoins = exploreCategory === 'trending' || exploreCategory === 'top'
    ? coins
    : coins; // For nft/defi, show all coins (could be enhanced later)
  const visibleCoins = filteredCoins;
  // Memoize symbols to avoid WebSocket re-subscribe on every render (e.g. when quotes update)
  const visibleSymbols = useMemo(
    () => visibleCoins.map((c) => c.symbol),
    [visibleCoins]
  );
  const { quotes } = useMarketPriceStream(visibleSymbols, { enabled: isFocused });
  const liveVisibleCoins = visibleCoins.map((coin) => {
    const q = quotes[coin.symbol.toUpperCase()];
    if (!q) return coin;
    return {
      ...coin,
      price: Number.isFinite(q.price) ? q.price : coin.price,
      change24h: Number.isFinite(q.percentChange24h) ? q.percentChange24h : coin.change24h,
    };
  });

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

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <SearchBar
        value={searchPreview}
        onChangeText={setSearchPreview}
        onFocus={() => {
          router.push('/search?segment=all' as never);
        }}
        placeholder="Search all: coins, news, users, boards, portfolio..."
      />
      <MarketCapPlaceholder liveUpdatesEnabled={isFocused} />
      <FilterPills
        categories={categories}
        selectedCategory={exploreCategory}
        onSelect={setExploreCategory}
      />
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
        initialNumToRender={10}
        maxToRenderPerBatch={5}
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
