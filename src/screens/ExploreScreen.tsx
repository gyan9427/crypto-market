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
  Platform,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useCollapsibleNavHeaderScrollHandlers } from '@/src/hooks/useCollapsibleNavHeader';
import { useRouter } from 'expo-router';
import { useIsFocused } from "expo-router/react-navigation";
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import { useAppStore } from '../state/useAppStore';
import { fetchActiveCoinsPage, fetchMarketSnapshot } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { navigateToCoin } from '../navigation/coinNavigation';
import {
  LivePriceQuote,
  useMarketPriceStream,
  useSparklineHistory,
  useSparklineRevision,
  useSparklineBaselineReady,
  prefetchSparklineBaselines,
  ensureSparklineBaseline,
} from '../hooks/useMarketPriceStream';
import { isSparklineBaselineReady } from '../hooks/sparklineHistoryHub';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import {
  isExploreMemoOptimizationsEnabled,
  isExploreStableLoadLifecycleEnabled,
} from '../config/exploreFeatureFlags';
import { applyMetadataCoins } from '../utils/exploreCoinUpdates';
import { coinScalarsEqual } from '../utils/reconcileTrendingCoins';
import { useExploreRenderAttribution } from '../utils/exploreRenderAttribution';
import { jumpAuditScroll } from '@/src/diagnostics/jumpCorrelationAudit';
import { useJumpCorrelationRender } from '@/src/diagnostics/useJumpCorrelationRender';

const GRAPH_ANIM_MS = 280;
const COIN_ROW_HEIGHT = 56;
const SKELETON_ROWS = Array(5).fill(null);

const CATEGORY_LABELS: Record<ExploreCategory, string> = {
  trending: 'Trending',
  top: 'Top',
  analysis: 'Analysis',
};

type LoadPhase = 'idle' | 'initial' | 'category' | 'refresh';

function resolveFetchCategory(category: ExploreCategory): 'trending' | 'top' {
  return category === 'analysis' ? 'trending' : category;
}

function sparklineRefs(coins: TrendingCoin[]) {
  return coins.map((c) => ({ symbol: c.symbol, price: c.price }));
}

function areExploreCoinRowPropsEqual(
  prev: { coin: TrendingCoin; isFocused: boolean; onPress: (coinId: string) => void },
  next: { coin: TrendingCoin; isFocused: boolean; onPress: (coinId: string) => void }
): boolean {
  if (prev.isFocused !== next.isFocused) return false;
  if (prev.onPress !== next.onPress) return false;
  if (!coinScalarsEqual(prev.coin, next.coin)) return false;
  return true;
}

const ExploreCoinRow = React.memo(function ExploreCoinRow({
  coin,
  isFocused,
  onPress,
}: {
  coin: TrendingCoin;
  isFocused: boolean;
  onPress: (coinId: string) => void;
}) {
  const rowProps = useMemo(() => ({ coin, isFocused, onPress }), [coin, isFocused, onPress]);
  useExploreRenderAttribution('ExploreCoinRow', rowProps, {
    coinId: coin.id,
    memoCompare: areExploreCoinRowPropsEqual,
  });

  const { quotes } = useMarketPriceStream([coin.symbol], { enabled: isFocused });
  const liveQuote: LivePriceQuote | undefined = quotes[coin.symbol.toUpperCase()];
  const sparklineData = useSparklineHistory(coin.symbol);
  const sparklineRevision = useSparklineRevision(coin.symbol);
  const baselineReady = useSparklineBaselineReady(coin.symbol);

  useEffect(() => {
    if (baselineReady) return;
    let cancelled = false;
    void ensureSparklineBaseline(coin.symbol, coin.price).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [coin.symbol, coin.price, baselineReady]);

  if (!baselineReady) {
    return <TrendingCoinCardSkeleton />;
  }

  return (
    <TrendingCoinCard
      coin={coin}
      sparklineData={sparklineData}
      sparklineRevision={sparklineRevision}
      liveQuote={liveQuote}
      onPress={onPress}
    />
  );
}, areExploreCoinRowPropsEqual);

ExploreCoinRow.displayName = 'ExploreCoinRow';

const ExploreListFooter = React.memo(function ExploreListFooter({
  loading,
  color,
}: {
  loading: boolean;
  color: string;
}) {
  if (!loading) return null;
  return (
    <View style={footerStyles.loader}>
      <ActivityIndicator size="small" color={color} />
    </View>
  );
});

const footerStyles = StyleSheet.create({
  loader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { tokens } = useAppTheme();
  const S = useMemo(() => buildExploreStyles(tokens), [tokens]);
  const collapsibleScrollHandlers = useCollapsibleNavHeaderScrollHandlers();
  const stableLifecycle = isExploreStableLoadLifecycleEnabled();
  const memoOpts = isExploreMemoOptimizationsEnabled();

  useExploreRenderAttribution('ExploreScreen', { isFocused, stableLifecycle });

  useEffect(() => {
    if (isFocused) setPerformanceScreen('Explore');
  }, [isFocused]);

  const [loadPhase, setLoadPhase] = useState<LoadPhase>('initial');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null | undefined>(undefined);
  const [marketGraphExpanded, setMarketGraphExpanded] = useState(true);
  const [measuredGraphHeight, setMeasuredGraphHeight] = useState(0);
  const graphHeightAnim = useRef(new RNAnimated.Value(0)).current;

  useJumpCorrelationRender('ExploreScreen', {
    isFocused,
    loadPhase,
    coinsLen: coins.length,
    marketGraphExpanded,
  });

  const graphMeasureReadyRef = useRef(false);
  const recordedGraphFullHeightRef = useRef(0);
  const lastSyncedGraphHeightRef = useRef(0);
  const skipToggleEffectOnceRef = useRef(false);
  const categoryGenerationRef = useRef(0);
  const skipCategoryLoadRef = useRef(true);

  const showSkeleton = stableLifecycle
    ? loadPhase === 'initial' && coins.length === 0
    : loading && coins.length === 0;

  const expandedGraphTargetHeight = useCallback(() => {
    const recorded = recordedGraphFullHeightRef.current;
    return recorded > 0 ? recorded : measuredGraphHeight;
  }, [measuredGraphHeight]);

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);
  const setMarketSnapshot = useAppStore((state) => state.setMarketSnapshot);

  const categories: ExploreCategory[] = ['trending', 'top'];

  const fetchPage = useCallback(async (cat: 'trending' | 'top') => {
    return Promise.all([
      fetchActiveCoinsPage(undefined, 20, cat),
      fetchMarketSnapshot().catch(() => null),
    ]);
  }, []);

  const loadFirstPage = useCallback(async () => {
    try {
      if (stableLifecycle) {
        setLoadPhase('initial');
      } else {
        setLoading(true);
        setCoins([]);
      }
      setError(null);
      setNextCursor(undefined);
      const cat = resolveFetchCategory(exploreCategory);
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await fetchPage(cat);
      if (snapshot) setMarketSnapshot(snapshot);
      setCoins((prev) => applyMetadataCoins(prev, pageCoins, 'replace'));
      setNextCursor(cursor);
      void prefetchSparklineBaselines(sparklineRefs(pageCoins));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore data:', err);
    } finally {
      if (stableLifecycle) {
        setLoadPhase('idle');
      } else {
        setLoading(false);
      }
    }
  }, [exploreCategory, fetchPage, setMarketSnapshot, stableLifecycle]);

  const loadCategoryPage = useCallback(async () => {
    const generation = ++categoryGenerationRef.current;
    try {
      setLoadPhase('category');
      setError(null);
      setNextCursor(undefined);
      const cat = resolveFetchCategory(exploreCategory);
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await fetchPage(cat);
      if (generation !== categoryGenerationRef.current) return;
      if (snapshot) setMarketSnapshot(snapshot);
      setCoins((prev) => applyMetadataCoins(prev, pageCoins, 'replace'));
      setNextCursor(cursor);
      void prefetchSparklineBaselines(sparklineRefs(pageCoins));
    } catch (err: any) {
      if (generation !== categoryGenerationRef.current) return;
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore category:', err);
    } finally {
      if (generation === categoryGenerationRef.current) {
        setLoadPhase('idle');
      }
    }
  }, [exploreCategory, fetchPage, setMarketSnapshot]);

  const loadInitialPageLegacy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCoins([]);
      setNextCursor(undefined);
      const cat = resolveFetchCategory(exploreCategory);
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await fetchPage(cat);
      if (snapshot) setMarketSnapshot(snapshot);
      setCoins((prev) => applyMetadataCoins(prev, pageCoins, 'replace'));
      setNextCursor(cursor);
      void prefetchSparklineBaselines(sparklineRefs(pageCoins));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [exploreCategory, fetchPage, setMarketSnapshot]);

  useEffect(() => {
    if (stableLifecycle) return;
    void loadInitialPageLegacy();
  }, [stableLifecycle, loadInitialPageLegacy]);

  useEffect(() => {
    if (!stableLifecycle) return;
    void loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableLifecycle]);

  useEffect(() => {
    if (!stableLifecycle) return;
    if (skipCategoryLoadRef.current) {
      skipCategoryLoadRef.current = false;
      return;
    }
    void loadCategoryPage();
  }, [exploreCategory, loadCategoryPage, stableLifecycle]);

  const refreshCoins = useCallback(async () => {
    try {
      const cat = resolveFetchCategory(exploreCategory);
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await fetchPage(cat);
      if (snapshot) setMarketSnapshot(snapshot);
      const needsBaseline = pageCoins.filter((c) => !isSparklineBaselineReady(c.symbol));
      if (needsBaseline.length > 0) {
        void prefetchSparklineBaselines(sparklineRefs(needsBaseline));
      }
      setCoins((prev) => applyMetadataCoins(prev, pageCoins, 'replace'));
      setNextCursor(cursor);
    } catch {
      // Silent — transient network blips shouldn't interrupt the visible list
    }
  }, [exploreCategory, fetchPage, setMarketSnapshot]);

  usePollingEffect(
    refreshCoins,
    [refreshCoins, isFocused],
    { enabled: isFocused, intervalMs: 20_000, immediate: false }
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || nextCursor === null || nextCursor === undefined) return;
    try {
      setLoadingMore(true);
      const cat = resolveFetchCategory(exploreCategory);
      const [{ coins: pageCoins, nextCursor: cursor }, snapshot] = await Promise.all([
        fetchActiveCoinsPage(nextCursor, 20, cat),
        fetchMarketSnapshot().catch(() => null),
      ]);
      if (snapshot) setMarketSnapshot(snapshot);
      setCoins((prev) => applyMetadataCoins(prev, pageCoins, 'append'));
      setNextCursor(cursor);
      void prefetchSparklineBaselines(sparklineRefs(pageCoins));
    } catch (err: any) {
      console.error('Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, exploreCategory, setMarketSnapshot]);

  const handleCoinPress = useCallback(
    (coinId: string) => {
      navigateToCoin(router, coinId, 'market');
    },
    [router]
  );

  const keyExtractor = useCallback(
    (item: TrendingCoin | null, index: number) => item?.id || `skeleton-${index}`,
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: TrendingCoin | null; index: number }) => {
      if (showSkeleton) {
        return <TrendingCoinCardSkeleton key={`skeleton-${index}`} />;
      }
      return <ExploreCoinRow coin={item!} isFocused={isFocused} onPress={handleCoinPress} />;
    },
    [showSkeleton, isFocused, handleCoinPress]
  );

  const getItemLayout = useMemo(
    () =>
      memoOpts
        ? (_data: ArrayLike<TrendingCoin | null> | null | undefined, index: number) => ({
            length: COIN_ROW_HEIGHT,
            offset: COIN_ROW_HEIGHT * index,
            index,
          })
        : undefined,
    [memoOpts]
  );

  const listFooter = useMemo(
    () => <ExploreListFooter loading={loadingMore} color={tokens.colors.primary[400]} />,
    [loadingMore, tokens.colors.primary]
  );

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

  const headerElement = (
    <View style={S.headerSection}>
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

      <Text style={S.listLabel}>
        {CATEGORY_LABELS[exploreCategory]} Coins
      </Text>
    </View>
  );

  const retryLoad = stableLifecycle ? loadFirstPage : loadInitialPageLegacy;

  if (error && coins.length === 0) {
    return (
      <View style={S.root}>
        <ServiceUnavailableState onRetry={retryLoad} />
      </View>
    );
  }

  return (
    <View style={S.root}>
      <Reanimated.FlatList
        data={showSkeleton ? SKELETON_ROWS : coins}
        keyExtractor={keyExtractor}
        ListHeaderComponent={headerElement}
        {...collapsibleScrollHandlers}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={listFooter}
        contentContainerStyle={S.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={memoOpts ? 7 : 21}
        removeClippedSubviews={memoOpts && Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      />
    </View>
  );
};

function buildExploreStyles(tokens: ThemeTokens) {
  const accentBg = tokens.isDark ? tokens.colors.primary[900] : tokens.colors.primary[50];

  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg,
  },

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
    color: tokens.colors.primary[400],
  },

  errorBanner: {
    backgroundColor: tokens.isDark ? tokens.colors.error[100] : tokens.colors.error[50],
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: tokens.colors.error[300],
  },
  errorBannerText: {
    color: tokens.colors.error[500],
    fontSize: 12,
  },

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
  });
}
