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
  ActivityIndicator,
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
import { fetchActiveCoinsPage } from '../services/api';
import { ExploreCategory, TrendingCoin } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { LivePriceQuote, useMarketPriceStream } from '../hooks/useMarketPriceStream';

const GRAPH_ANIM_MS = 280;

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
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildExploreScreenStyles(tokens), [tokens]);
  const c = tokens.colors;
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

  usePollingEffect(
    loadInitialPage,
    [loadInitialPage, isFocused],
    { enabled: isFocused, intervalMs: 20000, immediate: true }
  );

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
            <ChevronUp size={20} color={tokens.textMuted} accessibilityLabel="" />
          ) : (
            <ChevronDown size={20} color={tokens.textMuted} accessibilityLabel="" />
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
        <ServiceUnavailableState onRetry={loadInitialPage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={loading && coins.length === 0 ? Array(5).fill(null) : coins}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
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
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={c.primary[500]} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

function buildExploreScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    headerSection: {
      zIndex: 10,
      backgroundColor: tokens.bg,
      paddingBottom: s.xs,
    },
    graphChrome: {
      marginBottom: 0,
    },
    graphToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: s.lg,
      paddingTop: s.sm,
      paddingBottom: s.sm,
    },
    graphToggleLabel: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.heading,
      letterSpacing: typo.letterSpacing.subheading,
    },
    graphClip: {
      marginBottom: 0,
    },
    errorBanner: {
      backgroundColor: tokens.isDark ? 'rgba(239,68,68,0.12)' : c.error[50],
      padding: s.md,
      marginHorizontal: s.lg,
      marginTop: s.xs,
      borderRadius: tokens.borderRadius.lg,
      borderWidth: 1,
      borderColor: tokens.isDark ? 'rgba(239,68,68,0.25)' : c.error[100],
    },
    errorBannerText: {
      color: tokens.isDark ? c.danger[500] : c.error[700],
      fontSize: typo.fontSizes.sm,
      fontFamily: typo.fontFamilies.sans,
    },
    listContent: {
      paddingTop: s.xs,
      paddingBottom: 96,
    },
    footerLoader: {
      paddingVertical: s.md,
      alignItems: 'center',
    },
  });
}
