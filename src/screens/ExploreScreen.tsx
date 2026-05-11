import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { setPerformanceScreen } from '../services/requestCache';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  LayoutChangeEvent,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import { useAppStore } from '../state/useAppStore';
import { fetchActiveCoinsPage } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { LivePriceQuote, useMarketPriceStream } from '../hooks/useMarketPriceStream';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f',
  elevated: '#11111c',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#ffffff',
  textSub: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.4)',
  green: '#27c485',
  red: '#f05252',
  redBg: 'rgba(240,82,82,0.12)',
  blue: '#6383ff',
  blueBg: 'rgba(99,131,255,0.18)',
} as const;

const GRAPH_ANIM_MS = 280;

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

  return <TrendingCoinCard coin={coin} liveQuote={liveQuote} onPress={onPress} />;
});

ExploreCoinRow.displayName = 'ExploreCoinRow';

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const isFocused = useIsFocused();

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
  const graphHeightAnim = useRef(new Animated.Value(0)).current;
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
      const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
        undefined,
        20,
        exploreCategory
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

  // Trigger initial load (and reload on category change) without wiping the list
  // on the periodic background refresh below.
  useEffect(() => {
    void loadInitialPage();
  }, [loadInitialPage]);

  // Silent background refresh — preserves existing sparklineData so sparklines
  // don't flash blank each cycle, and skips the loading skeleton entirely.
  const refreshCoins = useCallback(async () => {
    try {
      const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
        undefined,
        20,
        exploreCategory
      );
      setCoins((prev) => {
        if (prev.length === 0) return pageCoins;
        const sparklineMap = new Map(prev.map((c) => [c.id, c.sparklineData]));
        return pageCoins.map((c) => ({
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
      const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
        nextCursor,
        20,
        exploreCategory
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
    Animated.timing(graphHeightAnim, {
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
          <ChevronUp size={16} color={C.textMuted} accessibilityLabel="" />
        ) : (
          <ChevronDown size={16} color={C.textMuted} accessibilityLabel="" />
        )}
      </TouchableOpacity>

      <Animated.View style={[S.graphClip, graphClipStyle]}>
        <View onLayout={onMarketGraphLayout} collapsable={false}>
          <MarketCapPlaceholder liveUpdatesEnabled={isFocused && marketGraphExpanded} />
        </View>
      </Animated.View>

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
      <FlatList
        data={loading && coins.length === 0 ? Array(5).fill(null) : coins}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        ListHeaderComponent={headerElement}
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
              <ActivityIndicator size="small" color={C.blue} />
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

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header chrome
  headerSection: {
    backgroundColor: C.bg,
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
    color: C.textSub,
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
    backgroundColor: C.blueBg,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.blue,
  },

  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(240,82,82,0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(240,82,82,0.25)',
  },
  errorBannerText: {
    color: C.red,
    fontSize: 12,
  },

  // List section label
  listLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
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
