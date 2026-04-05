import React, { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import { useAppStore } from '../state/useAppStore';
import { fetchTrendingCoins } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import { colors, spacing, typography } from '../theme/theme';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

const GRAPH_ANIM_MS = 280;

export const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) setPerformanceScreen('Explore');
  }, [isFocused]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [marketGraphExpanded, setMarketGraphExpanded] = useState(true);
  const [measuredGraphHeight, setMeasuredGraphHeight] = useState(0);
  const graphHeightAnim = useRef(new Animated.Value(0)).current;
  /** After first successful layout, we can clip with animated height. */
  const graphMeasureReadyRef = useRef(false);
  /** Max height seen while expanded — restore to this after collapse (layout while collapsed is unreliable). */
  const recordedGraphFullHeightRef = useRef(0);
  /** Last height we applied to graphHeightAnim from layout (remeasure when content grows). */
  const lastSyncedGraphHeightRef = useRef(0);
  /** Skip one useEffect run right after first sync (avoid fighting useLayoutEffect). */
  const skipToggleEffectOnceRef = useRef(false);

  const expandedGraphTargetHeight = useCallback(() => {
    const recorded = recordedGraphFullHeightRef.current;
    return recorded > 0 ? recorded : measuredGraphHeight;
  }, [measuredGraphHeight]);

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);

  const categories: ExploreCategory[] = ['trending', 'top'];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const trendingCoins = await fetchTrendingCoins(exploreCategory);
      setCoins(trendingCoins);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [exploreCategory]);

  usePollingEffect(
    loadData,
    [loadData, isFocused],
    { enabled: isFocused, intervalMs: 20000, immediate: true }
  );

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin/${coinId}` as never);
  };

  const visibleCoins = coins;
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

  const onMarketGraphLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    // While collapsed the clip is height 0 — ignore layout or we wipe the stored full height.
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

    // First layout can be a thin strip before chart/data paints; sync again when height changes.
    if (marketGraphExpanded) {
      const fullH = expandedGraphTargetHeight();
      if (Math.abs(fullH - lastSyncedGraphHeightRef.current) >= 1) {
        lastSyncedGraphHeightRef.current = fullH;
        graphHeightAnim.setValue(fullH);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- graphHeightAnim is stable Animated.Value
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

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.graphChrome}>
        <TouchableOpacity
          style={styles.graphToggleRow}
          onPress={toggleGraph}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={marketGraphExpanded ? 'Hide market chart' : 'Show market chart'}
        >
          <Text style={styles.graphToggleLabel}>Market overview</Text>
          {marketGraphExpanded ? (
            <ChevronUp size={22} color={colors.neutral[700]} accessibilityLabel="" />
          ) : (
            <ChevronDown size={22} color={colors.neutral[700]} accessibilityLabel="" />
          )}
        </TouchableOpacity>
        <Animated.View style={[styles.graphClip, graphClipStyle]}>
          <View onLayout={onMarketGraphLayout} collapsable={false}>
            <MarketCapPlaceholder liveUpdatesEnabled={isFocused && marketGraphExpanded} />
          </View>
        </Animated.View>
      </View>
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
    </View>
  );

  if (error && coins.length === 0) {
    return (
      <View style={styles.container}>
        <ServiceUnavailableState onRetry={loadData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
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
  graphChrome: {
    marginBottom: 0,
  },
  graphToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  graphToggleLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  graphClip: {
    marginBottom: 0,
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
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 96,
  },
});
