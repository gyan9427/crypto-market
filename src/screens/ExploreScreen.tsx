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
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { MarketAnalysisCard } from '../components/MarketAnalysisCard';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import { useAppStore } from '../state/useAppStore';
import { fetchActiveCoinsPage, fetchMarketAnalysis } from '../services/api';
import { ExploreCategory, MarketAnalysisCoin, TrendingCoin } from '../types';
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

const MarketAnalysisCoinRow = React.memo(function MarketAnalysisCoinRow({
  coin,
  rank,
  isFocused,
  onPress,
}: {
  coin: MarketAnalysisCoin;
  rank: number;
  isFocused: boolean;
  onPress: (coinId: string) => void;
}) {
  const { quotes } = useMarketPriceStream([coin.symbol], { enabled: isFocused });
  const liveQuote: LivePriceQuote | undefined = quotes[coin.symbol.toUpperCase()];

  return (
    <MarketAnalysisCard coin={coin} rank={rank} liveQuote={liveQuote} onPress={onPress} />
  );
});

MarketAnalysisCoinRow.displayName = 'MarketAnalysisCoinRow';

export const ExploreScreen: React.FC = () => {
  const { t } = useTranslation();
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
  const [analysisCoins, setAnalysisCoins] = useState<MarketAnalysisCoin[]>([]);
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

  const categories: ExploreCategory[] = ['analysis', 'trending', 'top'];
  const isAnalysis = exploreCategory === 'analysis';

  const loadInitialPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCoins([]);
      setAnalysisCoins([]);
      setNextCursor(undefined);

      if (exploreCategory === 'analysis') {
        const { coins: ac } = await fetchMarketAnalysis();
        setAnalysisCoins(ac);
      } else {
        const { coins: pageCoins, nextCursor: cursor } = await fetchActiveCoinsPage(
          undefined,
          20,
          exploreCategory
        );
        setCoins(pageCoins);
        setNextCursor(cursor);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [exploreCategory]);

  const loadMore = useCallback(async () => {
    if (exploreCategory === 'analysis') return;
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
    } catch (err: unknown) {
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

  useEffect(() => {
    if (exploreCategory === 'analysis') {
      setMarketGraphExpanded(true);
    } else {
      graphMeasureReadyRef.current = false;
      recordedGraphFullHeightRef.current = 0;
      lastSyncedGraphHeightRef.current = 0;
      setMeasuredGraphHeight(0);
    }
  }, [exploreCategory]);

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
    if (!isAnalysis || measuredGraphHeight <= 0) return;

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
  }, [measuredGraphHeight, marketGraphExpanded, expandedGraphTargetHeight, isAnalysis]);

  useEffect(() => {
    if (!isAnalysis || measuredGraphHeight <= 0 || !graphMeasureReadyRef.current) return;
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
  }, [marketGraphExpanded, measuredGraphHeight, graphHeightAnim, expandedGraphTargetHeight, isAnalysis]);

  const toggleGraph = () => {
    setMarketGraphExpanded((v) => !v);
  };

  const graphClipStyle =
    measuredGraphHeight > 0
      ? { height: graphHeightAnim, overflow: 'hidden' as const }
      : { alignSelf: 'stretch' as const };

  const listEmpty =
    exploreCategory === 'analysis' ? analysisCoins.length === 0 : coins.length === 0;

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {isAnalysis ? (
        <>
          <View style={styles.graphChrome}>
            <TouchableOpacity
              style={styles.graphToggleRow}
              onPress={toggleGraph}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={marketGraphExpanded ? 'Hide market chart' : 'Show market chart'}
            >
              <Text style={styles.graphToggleLabel}>{t('explore.marketOverview')}</Text>
              {marketGraphExpanded ? (
                <ChevronUp size={22} color={c.neutral[700]} accessibilityLabel="" />
              ) : (
                <ChevronDown size={22} color={c.neutral[700]} accessibilityLabel="" />
              )}
            </TouchableOpacity>
            <Animated.View style={[styles.graphClip, graphClipStyle]}>
              <View onLayout={onMarketGraphLayout} collapsable={false}>
                <MarketCapPlaceholder liveUpdatesEnabled={isFocused && marketGraphExpanded} />
              </View>
            </Animated.View>
          </View>
          <Text style={styles.analysisSubtitle}>{t('explore.analysisSubtitle')}</Text>
        </>
      ) : null}
      <FilterPills
        categories={categories}
        selectedCategory={exploreCategory}
        onSelect={setExploreCategory}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  if (error && listEmpty && !loading) {
    return (
      <View style={styles.container}>
        <ServiceUnavailableState onRetry={loadInitialPage} />
      </View>
    );
  }

  const listData =
    loading && listEmpty
      ? Array(5).fill(null)
      : isAnalysis
        ? analysisCoins
        : coins;

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          isAnalysis
            ? (item as MarketAnalysisCoin)?.coinId || `skeleton-${index}`
            : (item as TrendingCoin)?.id || `skeleton-${index}`
        }
        renderItem={({ item, index }) => {
          if (loading && listEmpty) {
            return <TrendingCoinCardSkeleton key={`skeleton-${index}`} />;
          }
          if (isAnalysis) {
            const coin = item as MarketAnalysisCoin;
            return (
              <MarketAnalysisCoinRow
                coin={coin}
                rank={index + 1}
                isFocused={isFocused}
                onPress={handleCoinPress}
              />
            );
          }
          return (
            <ExploreCoinRow
              coin={item as TrendingCoin}
              isFocused={isFocused}
              onPress={handleCoinPress}
            />
          );
        }}
        onEndReached={isAnalysis ? undefined : loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && isAnalysis && analysisCoins.length === 0 ? (
            <Text style={styles.emptyAnalysis}>{t('explore.analysisEmpty')}</Text>
          ) : null
        }
        ListFooterComponent={
          !isAnalysis && loadingMore ? (
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
      paddingTop: s.xs,
      paddingBottom: s.sm,
    },
    graphToggleLabel: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    graphClip: {
      marginBottom: 0,
    },
    analysisSubtitle: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      paddingHorizontal: s.lg,
      paddingBottom: s.sm,
      lineHeight: 18,
    },
    errorBanner: {
      backgroundColor: c.error[50],
      padding: s.md,
      marginHorizontal: 24,
      marginTop: s.xs,
      borderRadius: 16,
    },
    errorBannerText: {
      color: c.error[700],
      fontSize: 14,
    },
    listContent: {
      paddingTop: s.xs,
      paddingBottom: 96,
      paddingHorizontal: s.lg,
      flexGrow: 1,
    },
    footerLoader: {
      paddingVertical: s.md,
      alignItems: 'center',
    },
    emptyAnalysis: {
      textAlign: 'center',
      marginTop: s.lg,
      paddingHorizontal: s.lg,
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
  });
}
