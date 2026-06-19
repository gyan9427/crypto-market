import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  Modal,
  ActivityIndicator,
  Platform,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
  type FlatList,
} from 'react-native';
import Animated, { runOnUI } from 'react-native-reanimated';
import {
  useCollapsibleNavHeader,
  useCollapsibleNavHeaderScrollHandlers,
} from '@/src/hooks/useCollapsibleNavHeader';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Users, Compass } from 'lucide-react-native';
import { SegmentToggle } from '../components/SegmentToggle';
import { NewsCard } from '../components/NewsCard';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FeaturedCarouselSkeleton } from '../components/FeaturedCarouselSkeleton';
import { NewsCardSkeleton } from '../components/NewsCardSkeleton';
import { SaveToBoardModal } from '../components/SaveToBoardModal';
import { CommentTray } from '../components/CommentTray';
import { useAppStore } from '../state/useAppStore';
import { fetchNews, toggleReaction } from '../services/api';
import { NewsItem, ReactionType } from '../types';
import { useFeedOrchestrator } from '../hooks/useFeedOrchestrator';
import { useFeedIntentStore } from '../state/useFeedIntentStore';
import { NewsDetailModal } from './NewsDetailModal';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { buildAppWsUrl } from '@/src/config/wsBaseUrl';
import { shareNewsById } from '../utils/share';
import { navigateToCoin } from '../navigation/coinNavigation';

/** After this many article cards, insert the Featured carousel (sixth vertical block). */
const FEATURE_INSERT_AFTER = 5;

/** Articles fetched per page for Following / Explore infinite scroll. */
const FEED_PAGE_SIZE = 20;

/** Distance from list bottom (px) that triggers the next page fetch. */
const END_REACH_OFFSET_PX = 320;

/** Minimum gap between pagination requests. */
const LOAD_MORE_COOLDOWN_MS = 400;

/** Fire load-more when a row this close to the end becomes visible. */
const VIEWABILITY_END_BUFFER = 2;

const FEED_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 25,
  minimumViewTime: 100,
};

type FeaturedRow = { type: 'featured' };
type FeedRow = NewsItem | FeaturedRow | null;

function buildFeedRows(
  news: NewsItem[],
  hasFeaturedContent: boolean,
  loadingInitial: boolean
): FeedRow[] {
  if (loadingInitial && news.length === 0) {
    return Array(FEATURE_INSERT_AFTER).fill(null);
  }
  if (!hasFeaturedContent) {
    return news;
  }
  if (news.length >= FEATURE_INSERT_AFTER) {
    return [
      ...news.slice(0, FEATURE_INSERT_AFTER),
      { type: 'featured' as const },
      ...news.slice(FEATURE_INSERT_AFTER),
    ];
  }
  return [...news, { type: 'featured' as const }];
}

function isFeaturedRow(item: FeedRow): item is FeaturedRow {
  return item != null && typeof item === 'object' && 'type' in item && item.type === 'featured';
}

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildHomeStyles(tokens), [tokens]);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawNewsData, setRawNewsData] = useState<NewsItem[]>([]);
  const [rawFeaturedNews, setRawFeaturedNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [feedScrollEnabled, setFeedScrollEnabled] = useState(true);

  const feedFilter = useAppStore((state) => state.feedFilter);
  const setFeedFilter = useAppStore((state) => state.setFeedFilter);
  const setReaction = useAppStore((state) => state.setReaction);
  const newsReactions = useAppStore((state) => state.newsReactions);
  const recordSearchCoin = useFeedIntentStore((s) => s.recordSearchCoin);
  const recordArticleRead = useFeedIntentStore((s) => s.recordArticleRead);

  const { articles: newsData, isPending: feedPending } = useFeedOrchestrator(rawNewsData, feedFilter);
  const { articles: featuredNews } = useFeedOrchestrator(rawFeaturedNews, 'explore');

  const loadGenerationRef = useRef(0);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const rawCountRef = useRef(0);
  const lastLoadMoreAtRef = useRef(0);
  const listViewportHeightRef = useRef(0);
  const listContentHeightRef = useRef(0);
  const loadMoreRef = useRef<() => Promise<void>>(async () => {});
  const tryFillShortListRef = useRef<() => void>(() => {});
  const feedRowCountRef = useRef(0);
  const carouselInteractionActiveRef = useRef(false);
  const feedListRef = useRef<FlatList<FeedRow>>(null);
  const { headerScrollFrozen } = useCollapsibleNavHeader();
  const showFeedLoading = loading || feedPending;

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    rawCountRef.current = rawNewsData.length;
  }, [rawNewsData.length]);

  const attachFeedItemState = useCallback((items: NewsItem[]): NewsItem[] => {
    const { newsReactions: reactions, isSavedToAnyBoard: savedFn } = useAppStore.getState();
    return items.map((item) => ({
      ...item,
      userReaction: reactions[item.id] ?? item.userReaction ?? null,
      isSaved: savedFn(item.id),
    }));
  }, []);

  const loadNews = useCallback(async (options?: { background?: boolean }) => {
    const isBackground = options?.background === true;
    const generation = loadGenerationRef.current;
    const filter = useAppStore.getState().feedFilter;

    try {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }

      pageRef.current = 1;
      hasMoreRef.current = true;
      setHasMore(true);

      const featuredLimit = 3;
      const [news, exploreTop] = await Promise.all([
        fetchNews(filter, 1, FEED_PAGE_SIZE, []),
        filter === 'following'
          ? fetchNews('explore', 1, featuredLimit, [])
          : Promise.resolve(null),
      ]);
      if (generation !== loadGenerationRef.current) return;

      const newsWithState = attachFeedItemState(news);
      setRawNewsData(newsWithState);
      hasMoreRef.current = news.length >= FEED_PAGE_SIZE;
      setHasMore(hasMoreRef.current);

      if (filter === 'explore') {
        setRawFeaturedNews(newsWithState);
      } else if (exploreTop) {
        setRawFeaturedNews(attachFeedItemState(exploreTop));
      }
    } catch (err: unknown) {
      if (generation !== loadGenerationRef.current) return;
      if (!isBackground) {
        const message = err instanceof Error ? err.message : t('errors.failedToLoadNews');
        setError(message);
      }
      console.error('Error loading news:', err);
    } finally {
      if (generation === loadGenerationRef.current && !isBackground) {
        setLoading(false);
        setTimeout(() => tryFillShortListRef.current(), 300);
      }
    }
  }, [t, attachFeedItemState]);

  const loadMore = useCallback(async () => {
    const now = Date.now();
    if (now - lastLoadMoreAtRef.current < LOAD_MORE_COOLDOWN_MS) return;
    if (loadingMoreRef.current || !hasMoreRef.current || loadingRef.current) return;
    if (rawCountRef.current === 0) return;

    lastLoadMoreAtRef.current = now;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const filter = useAppStore.getState().feedFilter;
      const nextPage = pageRef.current + 1;
      const news = await fetchNews(filter, nextPage, FEED_PAGE_SIZE, []);

      if (news.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      pageRef.current = nextPage;
      const withState = attachFeedItemState(news);

      setRawNewsData((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const unique = withState.filter((item) => !seen.has(item.id));
        return unique.length > 0 ? [...prev, ...unique] : prev;
      });

      if (news.length < FEED_PAGE_SIZE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch (err: unknown) {
      console.error('Error loading more news:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setTimeout(() => tryFillShortListRef.current(), 300);
    }
  }, [attachFeedItemState]);

  loadMoreRef.current = loadMore;

  const tryLoadMoreFromScroll = useCallback(() => {
    void loadMoreRef.current();
  }, []);

  const handleScrollNearEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (contentSize.height <= 0) return;
      const visibleBottom = layoutMeasurement.height + contentOffset.y;
      const distanceFromEnd = contentSize.height - visibleBottom;
      if (distanceFromEnd <= END_REACH_OFFSET_PX) {
        void loadMore();
      }
    },
    [loadMore]
  );

  const tryFillShortList = useCallback(() => {
    const viewport = listViewportHeightRef.current;
    const content = listContentHeightRef.current;
    if (viewport <= 0 || content <= 0) return;
    if (content <= viewport + 48 && hasMoreRef.current) {
      void loadMore();
    }
  }, [loadMore]);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      listContentHeightRef.current = height;
      tryFillShortList();
    },
    [tryFillShortList]
  );

  const handleListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      listViewportHeightRef.current = event.nativeEvent.layout.height;
      tryFillShortList();
    },
    [tryFillShortList]
  );

  tryFillShortListRef.current = tryFillShortList;

  const collapsibleScrollHandlers = useCollapsibleNavHeaderScrollHandlers({
    onNearEnd: tryLoadMoreFromScroll,
    endReachOffsetPx: END_REACH_OFFSET_PX,
  });

  useEffect(() => {
    loadNews();
  }, [feedFilter, loadNews]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshInFlight = false;
    let closing = false;

    const queueBackgroundRefresh = () => {
      if (refreshInFlight || refreshTimer) return;
      refreshTimer = setTimeout(async () => {
        refreshTimer = null;
        refreshInFlight = true;
        try {
          await loadNews({ background: true });
        } finally {
          refreshInFlight = false;
        }
      }, 350);
    };

    const connect = () => {
      if (closing) return;
      ws = new WebSocket(buildAppWsUrl());

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'news_subscribe' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as { type?: string };
          if (message.type === 'news:new') {
            queueBackgroundRefresh();
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        ws = null;
        if (closing) return;
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      closing = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      ws?.close();
      ws = null;
    };
  }, [loadNews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const handleSegmentChange = useCallback((index: number) => {
    const next = index === 0 ? 'following' : 'explore';
    if (next === feedFilter) return;
    loadGenerationRef.current += 1;
    pageRef.current = 1;
    setHasMore(true);
    setLoading(true);
    setRawNewsData([]);
    setRawFeaturedNews([]);
    setFeedFilter(next);
  }, [feedFilter, setFeedFilter]);

  const handleReact = useCallback(async (newsId: string, type: ReactionType) => {
    const currentReaction = newsReactions[newsId] ?? null;
    const newReaction = currentReaction === type ? null : type;
    setReaction(newsId, newReaction);

    const optimisticUpdate = (item: NewsItem): NewsItem => {
      if (item.id !== newsId) return item;
      const prev = { ...(item.reactions ?? { appreciate: 0, insightful: 0, bullish: 0, risk: 0, deepDive: 0, debatable: 0, total: 0 }) };
      if (currentReaction) {
        prev[currentReaction] = Math.max(0, (prev[currentReaction] ?? 0) - 1);
        prev.total = Math.max(0, prev.total - 1);
      }
      if (newReaction) {
        prev[newReaction] = (prev[newReaction] ?? 0) + 1;
        prev.total = prev.total + 1;
      }
      return { ...item, userReaction: newReaction, reactions: prev };
    };

    setRawNewsData((prev) => prev.map(optimisticUpdate));

    try {
      const result = await toggleReaction(newsId, type);
      setReaction(newsId, result.userReaction);
      const applyServer = (items: NewsItem[]) =>
        items.map((item) =>
          item.id === newsId
            ? { ...item, reactions: result.reactions, userReaction: result.userReaction }
            : item
        );
      setRawNewsData((prev) => applyServer(prev));
    } catch (error) {
      setReaction(newsId, currentReaction);
      setRawNewsData((prev) =>
        prev.map((item) =>
          item.id === newsId ? { ...item, userReaction: currentReaction } : item
        )
      );
      console.error('Failed to toggle reaction:', error);
    }
  }, [newsReactions, setReaction]);

  const handleSave = useCallback((newsId: string) => {
    setSavingNewsId(newsId);
  }, []);

  const handleSaved = useCallback((newsId: string, saveCount: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, isSaved: true, saveCount } : item;
    setRawNewsData((prev) => prev.map(update));
    setSavingNewsId(null);
  }, []);

  const handleComment = useCallback((newsId: string) => {
    setCommentingNewsId(newsId);
  }, []);

  const handleCommentCountChange = useCallback((newsId: string, count: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, comments: count } : item;
    setRawNewsData((prev) => prev.map(update));
  }, []);

  const handleShare = useCallback((newsId: string) => {
    void shareNewsById(newsId, [...newsData, ...featuredNews]);
  }, [newsData, featuredNews]);

  const openNewsDetailById = useCallback((newsId: string) => {
    recordArticleRead(newsId);
    const allNewsSources: NewsItem[] = [...newsData, ...featuredNews.slice(0, 3)];

    const newsItem = allNewsSources.find((item) => item.id === newsId);
    if (!newsItem) {
      return;
    }

    const dummyBody =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum at magna euismod, consectetur nibh at, sollicitudin tortor. ' +
      'Integer finibus, nibh vel tempor placerat, nunc sem pretium sapien, vel pulvinar nisi justo non urna.\n\n' +
      'Suspendisse potenti. Morbi non magna eget elit gravida hendrerit. Donec aliquam, nisl in dictum sagittis, ' +
      'lectus lorem pulvinar enim, quis hendrerit dui nunc sit amet metus. This is placeholder copy used while the full article integration is in progress.';

    setSelectedNews({
      ...newsItem,
      content: newsItem.content || `${newsItem.snippet}\n\n${dummyBody}`,
    });
    setIsDetailVisible(true);
  }, [newsData, featuredNews, recordArticleRead]);

  const handleFeaturedNewsPress = useCallback(
    (newsId: string) => {
      openNewsDetailById(newsId);
    },
    [openNewsDetailById]
  );

  const handleFeaturedScrollInteraction = useCallback(
    (active: boolean) => {
      if (active === carouselInteractionActiveRef.current) return;
      carouselInteractionActiveRef.current = active;

      runOnUI((frozen: number) => {
        'worklet';
        headerScrollFrozen.value = frozen;
      })(active ? 1 : 0);

      const scrollEnabled = !active;
      feedListRef.current?.setNativeProps({ scrollEnabled });
      setFeedScrollEnabled(scrollEnabled);
    },
    [headerScrollFrozen]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  }, []);

  const handleCoinPress = useCallback(
    (coinId: string) => {
      const fromFeed = [...newsData, ...featuredNews].find((n) =>
        n.coins.some((c) => c.id === coinId)
      );
      const coin =
        fromFeed?.coinContext?.primaryCoin.id === coinId
          ? fromFeed.coinContext.primaryCoin
          : fromFeed?.coins.find((c) => c.id === coinId);
      if (coin?.symbol) recordSearchCoin(coin.symbol);
      navigateToCoin(router, coinId, 'home');
    },
    [router, newsData, featuredNews, recordSearchCoin]
  );

  const displayFeatured = useMemo(() => featuredNews.slice(0, 3), [featuredNews]);

  const hasFeaturedContent = displayFeatured.length > 0;
  const feedRows = useMemo(
    () => buildFeedRows(newsData, hasFeaturedContent, showFeedLoading && newsData.length === 0),
    [newsData, hasFeaturedContent, showFeedLoading]
  );

  useEffect(() => {
    feedRowCountRef.current = feedRows.length;
  }, [feedRows.length]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length || feedRowCountRef.current === 0) return;
      const maxIndex = Math.max(
        ...viewableItems.map((item) => (item.index == null ? -1 : item.index))
      );
      if (maxIndex >= feedRowCountRef.current - VIEWABILITY_END_BUFFER) {
        void loadMoreRef.current();
      }
    },
    []
  );

  const feedIcons = useMemo(() => [
    <Users size={14} color={feedFilter === 'following' ? tokens.colors.primary[tokens.isDark ? 400 : 600] : tokens.textMuted} strokeWidth={2} />,
    <Compass size={14} color={feedFilter === 'explore' ? tokens.colors.primary[tokens.isDark ? 400 : 600] : tokens.textMuted} strokeWidth={2} />,
  ], [feedFilter, tokens]);

  const listHeaderComponent = useMemo(
    () => (
      <>
        <SegmentToggle
          options={[t('feed.following'), t('feed.explore')]}
          subtitles={[t('feed.followingSubtitle'), t('feed.exploreSubtitle')]}
          icons={feedIcons}
          selectedIndex={feedFilter === 'following' ? 0 : 1}
          onSelect={handleSegmentChange}
        />
        {error && newsData.length > 0 && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </>
    ),
    [error, newsData.length, feedFilter, handleSegmentChange, styles, t]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FeedRow; index: number }) => {
      if (showFeedLoading && newsData.length === 0) {
        return <NewsCardSkeleton key={`skeleton-${index}`} />;
      }
      if (item === null) {
        return <NewsCardSkeleton key={`skeleton-${index}`} />;
      }
      if (isFeaturedRow(item)) {
        return featuredNews.length === 0 ? (
          <FeaturedCarouselSkeleton onScrollInteractionChange={handleFeaturedScrollInteraction} />
        ) : (
          <FeaturedCarousel
            items={displayFeatured}
            onItemPress={handleFeaturedNewsPress}
            onScrollInteractionChange={handleFeaturedScrollInteraction}
          />
        );
      }
      return (
        <NewsCard
          item={item}
          onReact={handleReact}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
          onCoinPress={handleCoinPress}
          onPress={openNewsDetailById}
        />
      );
    },
    [
      showFeedLoading,
      newsData.length,
      displayFeatured,
      handleFeaturedNewsPress,
      handleFeaturedScrollInteraction,
      handleReact,
      handleComment,
      handleShare,
      handleSave,
      handleCoinPress,
      openNewsDetailById,
    ]
  );

  const keyExtractor = useCallback((item: FeedRow, index: number) => {
    if (item === null) return `skeleton-${index}`;
    if (isFeaturedRow(item)) return 'featured-row';
    return item.id;
  }, []);

  if (error && newsData.length === 0 && !showFeedLoading) {
    return (
      <View style={styles.container}>
        <ServiceUnavailableState onRetry={loadNews} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={feedListRef}
        style={styles.list}
        data={feedRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeaderComponent}
        scrollEnabled={feedScrollEnabled}
        canCancelContentTouches={false}
        {...collapsibleScrollHandlers}
        onLayout={handleListLayout}
        onContentSizeChange={handleContentSizeChange}
        onMomentumScrollEnd={handleScrollNearEnd}
        onScrollEndDrag={handleScrollNearEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={FEED_VIEWABILITY_CONFIG}
        ListEmptyComponent={
          !showFeedLoading && newsData.length === 0 && rawNewsData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('home.noResults')}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.15}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary[500]}
            colors={[tokens.colors.primary[500]]}
          />
        }
      />

      {selectedNews && (
        <Modal
          visible={isDetailVisible}
          animationType="slide"
          onRequestClose={handleCloseDetail}
        >
          <NewsDetailModal newsItem={selectedNews} onClose={handleCloseDetail} />
        </Modal>
      )}

      <SaveToBoardModal
        visible={savingNewsId !== null}
        newsId={savingNewsId}
        onClose={() => setSavingNewsId(null)}
        onSaved={handleSaved}
      />

      <CommentTray
        visible={commentingNewsId !== null}
        newsId={commentingNewsId}
        commentCount={
          commentingNewsId
            ? (newsData.find((n) => n.id === commentingNewsId)?.comments ?? 0)
            : 0
        }
        onClose={() => setCommentingNewsId(null)}
        onCountChange={handleCommentCountChange}
      />
    </View>
  );
};

function buildHomeStyles(tokens: ThemeTokens) {
  const { semantic, spacing: s } = tokens;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    list: {
      flex: 1,
    },
    errorBanner: {
      backgroundColor: tokens.colors.error[50],
      padding: s.md,
      marginHorizontal: semantic.listMarginH,
      marginTop: s.sm,
      borderRadius: semantic.cardRadius,
    },
    errorBannerText: {
      color: tokens.colors.error[700],
      fontSize: 14,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    emptyContainer: {
      padding: s.xxl,
      alignItems: 'center',
    },
    emptyText: {
      color: tokens.textMuted,
      fontSize: 16,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    listContent: {
      paddingTop: s.sm,
      paddingBottom: 120,
    },
    footerLoader: {
      paddingVertical: s.lg,
      alignItems: 'center',
    },
  });
}
