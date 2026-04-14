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
  type ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { FilterPills } from '../components/FilterPills';
import { MarketCapPlaceholder } from '../components/MarketCapPlaceholder';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { TrendingCoinCardSkeleton } from '../components/TrendingCoinCardSkeleton';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import { useAppStore } from '../state/useAppStore';
import {
  fetchTrendingCoins,
  fetchMarketSnapshot,
  mapSnapshotRowToTrendingCoin,
  enrichTrendingCoinsWithSnapshot,
} from '../services/api';
import { isMarketSnapshotUiEnabled } from '../config/marketSnapshotFlags';
import { ExploreCategory, TrendingCoin } from '../types';
import type { MarketSnapshotV2 } from '../types/marketSnapshot';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePollingEffect } from '../hooks/usePollingEffect';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

const GRAPH_ANIM_MS = 280;
const LIST_POLL_MS_WS_HEALTHY = 4 * 60 * 1000;
const LIST_POLL_MS_WS_FALLBACK = 20_000;
const VIEWPORT_SUB_DEBOUNCE_MS = 200;
const VIEWPORT_SYMBOL_BUFFER_BEFORE = 3;
const VIEWPORT_SYMBOL_BUFFER_AFTER = 6;
const INITIAL_WS_SYMBOLS = 16;

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
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  /** Phase 4: symbols for WS subscribe, derived from visible rows (+buffer), debounced. */
  const [viewportSymbolList, setViewportSymbolList] = useState<string[]>([]);
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
  const setMarketSnapshot = useAppStore((state) => state.setMarketSnapshot);

  /** Phase 2: when true, list uses GET /api/market/snapshot; trending still fetched in parallel for A/B. */
  const marketSnapshotUi = useMemo(() => isMarketSnapshotUiEnabled(), []);

  const categories: ExploreCategory[] = ['trending', 'top'];

  useEffect(() => {
    setViewportSymbolList([]);
  }, [exploreCategory]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /**
       * Snapshot path must NOT await `/market/trending` — that route can take 10s+ (CMC + DB).
       * Redis snapshot is enough for list + sparklines; only fall back to trending if snapshot fails.
       */
      if (marketSnapshotUi) {
        try {
          const snap = await fetchMarketSnapshot();
          setMarketSnapshot(snap, null);
          const rows = snap.tabs.trending;
          const fid = new Set(useAppStore.getState().followingCoins);
          const mapped = rows.map((r) => mapSnapshotRowToTrendingCoin(r, exploreCategory, fid));
          setCoins(enrichTrendingCoinsWithSnapshot(mapped, snap));
        } catch (snapErr) {
          const msg = snapErr instanceof Error ? snapErr.message : String(snapErr);
          setMarketSnapshot(useAppStore.getState().marketSnapshot, msg);
          const lastSnap = useAppStore.getState().marketSnapshot;
          try {
            const trendingCoins = await fetchTrendingCoins(exploreCategory);
            setCoins(enrichTrendingCoinsWithSnapshot(trendingCoins, lastSnap));
          } catch (trendErr) {
            throw trendErr instanceof Error ? trendErr : new Error(String(trendErr));
          }
        }
        return;
      }

      const snapshotPromise = fetchMarketSnapshot().catch(() => null);
      const trendingRes = await fetchTrendingCoins(exploreCategory).then(
        (v) => ({ ok: true as const, v }),
        (e) => ({ ok: false as const, e })
      );
      const snapshotValue = await snapshotPromise;

      if (snapshotValue) {
        setMarketSnapshot(snapshotValue, null);
      } else {
        setMarketSnapshot(useAppStore.getState().marketSnapshot, null);
      }

      const snapshotForSparklines: MarketSnapshotV2 | null =
        snapshotValue ?? useAppStore.getState().marketSnapshot;

      if (!trendingRes.ok) {
        throw trendingRes.e instanceof Error ? trendingRes.e : new Error(String(trendingRes.e));
      }
      setCoins(enrichTrendingCoinsWithSnapshot(trendingRes.v, snapshotForSparklines));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t('errors.failedToLoadData'));
      console.error('Error loading explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [exploreCategory, marketSnapshotUi, setMarketSnapshot, t]);

  const coinsRef = useRef(coins);
  coinsRef.current = coins;
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushViewportSymbols = useCallback((indices: number[]) => {
    const list = coinsRef.current;
    if (!list.length || !indices.length) return;
    const minRaw = Math.min(...indices);
    const maxRaw = Math.max(...indices);
    const minIdx = Math.max(0, minRaw - VIEWPORT_SYMBOL_BUFFER_BEFORE);
    const maxIdx = Math.min(list.length - 1, maxRaw + VIEWPORT_SYMBOL_BUFFER_AFTER);
    const out: string[] = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      out.push(list[i].symbol.trim().toUpperCase());
    }
    setViewportSymbolList(Array.from(new Set(out)));
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
      const idxs = viewableItems
        .filter((v) => v.isViewable && typeof v.index === 'number')
        .map((v) => v.index as number);
      if (!idxs.length) return;
      viewportDebounceRef.current = setTimeout(() => {
        flushViewportSymbols(idxs);
      }, VIEWPORT_SUB_DEBOUNCE_MS);
    },
    [flushViewportSymbols]
  );

  useEffect(
    () => () => {
      if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
    },
    []
  );

  const subscriptionSymbols = useMemo(() => {
    if (viewportSymbolList.length > 0) return viewportSymbolList;
    return coins.slice(0, INITIAL_WS_SYMBOLS).map((c) => c.symbol.trim().toUpperCase());
  }, [viewportSymbolList, coins]);

  const { quotes, isConnected } = useMarketPriceStream(subscriptionSymbols, { enabled: isFocused });

  const listPollIntervalMs = isConnected ? LIST_POLL_MS_WS_HEALTHY : LIST_POLL_MS_WS_FALLBACK;

  usePollingEffect(loadData, [loadData, isFocused, listPollIntervalMs], {
    enabled: isFocused,
    intervalMs: listPollIntervalMs,
    immediate: true,
  });

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin/${coinId}` as never);
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 25,
    minimumViewTime: 100,
  }).current;

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
          accessibilityLabel={
            marketGraphExpanded ? t('accessibility.hideMarketChart') : t('accessibility.showMarketChart')
          }
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
        data={loading && coins.length === 0 ? Array(5).fill(null) : coins}
        extraData={quotes}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        renderItem={({ item, index }) => {
          if (loading && coins.length === 0) {
            return <TrendingCoinCardSkeleton key={`skeleton-${index}`} />;
          }
          const coin = item as TrendingCoin;
          const q = quotes[coin.symbol.toUpperCase()];
          const liveCoin =
            q && Number.isFinite(q.price)
              ? {
                  ...coin,
                  price: q.price,
                  change24h: Number.isFinite(q.percentChange24h)
                    ? q.percentChange24h
                    : coin.change24h,
                }
              : coin;
          return <TrendingCoinCard coin={liveCoin} onPress={handleCoinPress} />;
        }}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
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
  },
});
}
