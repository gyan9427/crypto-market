import React, { useState, useCallback, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { setPerformanceScreen } from '../services/requestCache';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  LayoutChangeEvent,
  Animated as RNAnimated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useCollapsibleNavHeaderScrollHandlers } from '@/src/hooks/useCollapsibleNavHeader';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import { useAppStore } from '../state/useAppStore';
import { fetchActiveCoinsPage, fetchMarketSnapshot, enrichTrendingCoinsWithSnapshot } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { LivePriceQuote, useMarketPriceStream, useSparklineHistory, seedPriceHistory } from '../hooks/useMarketPriceStream';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';

const GRAPH_ANIM_MS = 280;

const MARKET_ACCENT = '#6383ff';

const CATEGORY_LABELS: Record<ExploreCategory, string> = {
  trending: 'Trending',
  top: 'Top',
  analysis: 'Analysis',
};

const ExploreCoinRow = React.memo(function ExploreCoinRow({
  coin,
  isFocused,
  onPress,
}: {
  coin: TrendingCoin;
  isFocused: boolean;
  onPress: (coinId: string) => void;
}) {
  const { quotes } = useMarketPriceStream([coin.symbol], { enabled: isFocused });
  const liveQuote: LivePriceQuote | undefined = quotes[coin.symbol.toUpperCase()];
  const liveTicks = useSparklineHistory(coin.symbol);

  // Merge snapshot baseline with live ticks so the sparkline shows real movement.
  // Keep last 40 snapshot points as context, then append all accumulated live ticks.
  const enrichedCoin = useMemo(() => {
    if (liveTicks.length < 2) return coin;
    const base = coin.sparklineData;
    const combined = base && base.length >= 2
      ? [...base.slice(-40), ...liveTicks]
      : liveTicks;
    return { ...coin, sparklineData: combined };
  }, [coin, liveTicks]);

  // Seed history with snapshot closes so the sparkline is populated from the first render.
  useEffect(() => {
    if (coin.sparklineData && coin.sparklineData.length >= 2) {
      seedPriceHistory(coin.symbol, coin.sparklineData);
    }
  }, [coin.symbol, coin.sparklineData]);

  return <TrendingCoinCard coin={enrichedCoin} liveQuote={liveQuote} onPress={onPress} />;
});

ExploreCoinRow.displayName = 'ExploreCoinRow';

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { tokens } = useAppTheme();
  const S = useMemo(() => buildExploreStyles(tokens), [tokens]);
  const collapsibleScrollHandlers = useCollapsibleNavHeaderScrollHandlers();

  useEffect(() => {
    if (isFocused) setPerformanceScreen('Explore');
  }, [isFocused]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null | undefined>(undefined);
  const [marketGraphExpanded, setMarketGraphExpanded] = useState(true);
  const [measuredGraphHeight, setMeasuredGraphHeight] = useState(0);
  const graphHeightAnim = useRef(new RNAnimated.Value(0)).current;
  const graphMeasureReadyRef = useRef(false);
  const recordedGraphFullHeightRef = useRef(0);
  const lastSyncedGraphHeightRef = useRef(0);
  const skipToggleEffectOnceRef = useRef(false);

  const expandedGraphTargetHeight = useCallback(() => {
    const recorded = recordedGraphFullHeightRef.current;
    return recorded > 0 ? recorded : measuredGraphHeight;
  }, [measuredGraphHeight]);

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);

  const categories: ExploreCategory[] = ['trending', 'top'];

  const loadInitialPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCoins([]);
      setNextCursor(undefined);
      const cat = exploreCategory === 'analysis' ? 'trending' : exploreCategory;
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await Promise.all([
        fetchActiveCoinsPage(undefined, 20, cat),
        fetchMarketSnapshot().catch(() => null),
      ]);
      setCoins(enrichTrendingCoinsWithSnapshot(pageCoins, snapshot));
      setNextCursor(cursor);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [exploreCategory]);

  // Trigger initial load (and reload on category change) without wiping the list
  // on the periodic background refresh below.
  useEffect(() => {
    void loadInitialPage();
  }, [loadInitialPage]);

  // Silent background refresh — preserves existing sparklineData so sparklines
  // don't flash blank each cycle, and skips the loading skeleton entirely.
  const refreshCoins = useCallback(async () => {
    try {
      const cat = exploreCategory === 'analysis' ? 'trending' : exploreCategory;
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await Promise.all([
        fetchActiveCoinsPage(undefined, 20, cat),
        fetchMarketSnapshot().catch(() => null),
      ]);
      const enriched = enrichTrendingCoinsWithSnapshot(pageCoins, snapshot);
      setCoins((prev) => {
        if (prev.length === 0) return enriched;
        const sparklineMap = new Map(prev.map((c) => [c.id, c.sparklineData]));
        return enriched.map((c) => ({
          ...c,
          sparklineData: c.sparklineData ?? sparklineMap.get(c.id),
        }));
      });
      setNextCursor(cursor);
    } catch {
      // Silent — transient network blips shouldn't interrupt the visible list
    }
  }, [exploreCategory]);

  usePollingEffect(
    refreshCoins,
    [refreshCoins, isFocused],
    { enabled: isFocused, intervalMs: 20_000, immediate: false }
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || nextCursor === null || nextCursor === undefined) return;
    try {
      setLoadingMore(true);
      const cat = exploreCategory === 'analysis' ? 'trending' : exploreCategory;
      const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
        nextCursor,
        20,
        cat
      );
      setCoins((prev) => [...prev, ...pageCoins]);
      setNextCursor(cursor);
    } catch (err: any) {
      console.error('Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, exploreCategory]);

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin/${coinId}` as never);
  };

  const onMarketGraphLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    if (!marketGraphExpanded) return;
    recordedGraphFullHeightRef.current = Math.max(recordedGraphFullHeightRef.current, h);
    setMeasuredGraphHeight((prev) => (Math.abs(prev - h) < 1 ? prev : h));
  };

  useLayoutEffect(() => {
    if (measuredGraphHeight <= 0) return;

    if (!graphMeasureReadyRef.current) {
      graphMeasureReadyRef.current = true;
      const fullH = expandedGraphTargetHeight();
      lastSyncedGraphHeightRef.current = fullH;
      const target = marketGraphExpanded ? fullH : 0;
      graphHeightAnim.setValue(target);
      skipToggleEffectOnceRef.current = true;
      return;
    }

    if (marketGraphExpanded) {
      const fullH = expandedGraphTargetHeight();
      if (Math.abs(fullH - lastSyncedGraphHeightRef.current) >= 1) {
        lastSyncedGraphHeightRef.current = fullH;
        graphHeightAnim.setValue(fullH);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredGraphHeight, marketGraphExpanded, expandedGraphTargetHeight]);

  useEffect(() => {
    if (measuredGraphHeight <= 0 || !graphMeasureReadyRef.current) return;
    if (skipToggleEffectOnceRef.current) {
      skipToggleEffectOnceRef.current = false;
      return;
    }
    const target = marketGraphExpanded ? expandedGraphTargetHeight() : 0;
    RNAnimated.timing(graphHeightAnim, {
      toValue: target,
      duration: GRAPH_ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [marketGraphExpanded, measuredGraphHeight, graphHeightAnim, expandedGraphTargetHeight]);

  const toggleGraph = () => {
    setMarketGraphExpanded((v) => !v);
  };

  const graphClipStyle =
    measuredGraphHeight > 0
      ? { height: graphHeightAnim, overflow: 'hidden' as const }
      : { alignSelf: 'stretch' as const };

  // IMPORTANT: build this as a React element (not a component function) and
  // pass the element to FlatList.ListHeaderComponent. VirtualizedList wraps
  // a function/component prop as `<ListHeaderComponent />`, so passing an
  // inline arrow function recreates the component type on every parent
  // render and unmounts + remounts the entire header subtree — which would
  // reset `MarketCapPlaceholder`'s internal state to zeros each cycle and
  // cause the Market Overview values to flicker $X → $0 → $X. Passing an
  // element lets React reconcile the tree in place and preserve child state.
  const headerElement = (
    <View style={S.headerSection}>
      {/* Market overview toggle + collapsible chart */}
      <TouchableOpacity
        style={S.graphToggleRow}
        onPress={toggleGraph}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={marketGraphExpanded ? 'Hide market chart' : 'Show market chart'}
      >
        <Text style={S.sectionTitle}>Market Overview</Text>
        {marketGraphExpanded ? (
          <ChevronUp size={16} color={tokens.textMuted} accessibilityLabel="" />
        ) : (
          <ChevronDown size={16} color={tokens.textMuted} accessibilityLabel="" />
        )}
      </TouchableOpacity>

      <RNAnimated.View style={[S.graphClip, graphClipStyle]}>
        <View onLayout={onMarketGraphLayout} collapsable={false}>
          <MarketCapPlaceholder liveUpdatesEnabled={isFocused && marketGraphExpanded} />
        </View>
      </RNAnimated.View>

      {/* Category tabs — same pattern as TradingScreen range tabs */}
      <View style={S.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[S.tab, exploreCategory === cat && S.tabActive]}
            onPress={() => setExploreCategory(cat)}
            accessibilityRole="button"
            accessibilityState={{ selected: exploreCategory === cat }}
          >
            <Text style={[S.tabText, exploreCategory === cat && S.tabTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={S.errorBanner}>
          <Text style={S.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Coins list label */}
      <Text style={S.listLabel}>
        {CATEGORY_LABELS[exploreCategory]} Coins
      </Text>
    </View>
  );

  if (error && coins.length === 0) {
    return (
      <View style={S.root}>
        <ServiceUnavailableState onRetry={loadInitialPage} />
      </View>
    );
  }

  return (
    <View style={S.root}>
      <Reanimated.FlatList
        data={loading && coins.length === 0 ? Array(5).fill(null) : coins}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        ListHeaderComponent={headerElement}
        {...collapsibleScrollHandlers}
        renderItem={({ item, index }) => {
          if (loading && coins.length === 0) {
            return <TrendingCoinCardSkeleton key={`skeleton-${index}`} />;
          }
          return <ExploreCoinRow coin={item} isFocused={isFocused} onPress={handleCoinPress} />;
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={S.footerLoader}>
              <ActivityIndicator size="small" color={MARKET_ACCENT} />
            </View>
          ) : null
        }
        contentContainerStyle={S.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      />
    </View>
  );
};

function buildExploreStyles(tokens: ThemeTokens) {
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';

  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg,
  },

  // Header chrome
  headerSection: {
    backgroundColor: tokens.bg,
  },
  graphToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.textMuted,
    letterSpacing: 0.2,
  },
  graphClip: {},

  // Category tabs — mirrors TradingScreen range tabs
  categoryRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: accentBg,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.textMuted,
  },
  tabTextActive: {
    color: MARKET_ACCENT,
  },

  // Error banner
  errorBanner: {
    backgroundColor: tokens.isDark ? 'rgba(240,82,82,0.12)' : 'rgba(240,82,82,0.08)',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: tokens.isDark ? 'rgba(240,82,82,0.25)' : 'rgba(240,82,82,0.2)',
  },
  errorBannerText: {
    color: tokens.colors.error[500],
    fontSize: 12,
  },

  // List section label
  listLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 6,
    letterSpacing: 0.2,
  },

  listContent: {
    paddingBottom: 96,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  });
}
