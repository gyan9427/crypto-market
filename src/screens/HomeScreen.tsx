import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import { NewsDetailModal } from './NewsDetailModal';
import { ServiceUnavailableState } from '../components/ServiceUnavailableState';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { buildAppWsUrl } from '@/src/config/wsBaseUrl';

/** After this many article cards, insert the Featured carousel (sixth vertical block). */
const FEATURE_INSERT_AFTER = 5;

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
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);

  const feedFilter = useAppStore((state) => state.feedFilter);
  const setFeedFilter = useAppStore((state) => state.setFeedFilter);
  const setReaction = useAppStore((state) => state.setReaction);
  const newsReactions = useAppStore((state) => state.newsReactions);

  const loadNews = useCallback(async (options?: { background?: boolean }) => {
    const isBackground = options?.background === true;
    try {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }
      const news = await fetchNews(feedFilter, 1, 50, []);
      const { newsReactions: reactions, isSavedToAnyBoard: savedFn } = useAppStore.getState();

      const newsWithState = news.map((item) => ({
        ...item,
        userReaction: reactions[item.id] ?? item.userReaction ?? null,
        isSaved: savedFn(item.id),
      }));

      setNewsData(newsWithState);

      if (feedFilter === 'explore') {
        setFeaturedNews(newsWithState.slice(0, 3));
      } else {
        try {
          const exploreTop = await fetchNews('explore', 1, 3, []);
          setFeaturedNews(exploreTop.slice(0, 3));
        } catch (err: any) {
          console.error('Error loading featured news:', err);
        }
      }
    } catch (err: any) {
      if (!isBackground) {
        setError(err.message || t('errors.failedToLoadNews'));
      }
      console.error('Error loading news:', err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [feedFilter, t]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

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
    setFeedFilter(index === 0 ? 'following' : 'explore');
  }, [setFeedFilter]);

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

    setNewsData((prev) => prev.map(optimisticUpdate));

    try {
      const result = await toggleReaction(newsId, type);
      setReaction(newsId, result.userReaction);
      const applyServer = (items: NewsItem[]) =>
        items.map((item) =>
          item.id === newsId
            ? { ...item, reactions: result.reactions, userReaction: result.userReaction }
            : item
        );
      setNewsData((prev) => applyServer(prev));
    } catch (error) {
      setReaction(newsId, currentReaction);
      setNewsData((prev) =>
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
    setNewsData((prev) => prev.map(update));
    setSavingNewsId(null);
  }, []);

  const handleComment = useCallback((newsId: string) => {
    setCommentingNewsId(newsId);
  }, []);

  const handleCommentCountChange = useCallback((newsId: string, count: number) => {
    const update = (item: NewsItem) =>
      item.id === newsId ? { ...item, comments: count } : item;
    setNewsData((prev) => prev.map(update));
  }, []);

  const handleShare = useCallback((newsId: string) => {
    console.log('Share:', newsId);
  }, []);

  const openNewsDetailById = useCallback((newsId: string) => {
    const allNewsSources: NewsItem[] = [...newsData, ...featuredNews];

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
  }, [newsData, featuredNews]);

  const handleFeaturedNewsPress = useCallback(
    (newsId: string) => {
      openNewsDetailById(newsId);
    },
    [openNewsDetailById]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  }, []);

  const handleCoinPress = useCallback((coinId: string) => {
    router.push(`/coins/${coinId}` as never);
  }, [router]);

  const hasFeaturedContent = featuredNews.length > 0;
  const feedRows = useMemo(
    () => buildFeedRows(newsData, hasFeaturedContent, loading && newsData.length === 0),
    [newsData, hasFeaturedContent, loading]
  );

  const listHeaderComponent = useMemo(
    () => (
      <>
        <SegmentToggle
          options={[t('feed.following'), t('feed.explore')]}
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
      if (loading && newsData.length === 0) {
        return <NewsCardSkeleton key={`skeleton-${index}`} />;
      }
      if (item === null) {
        return <NewsCardSkeleton key={`skeleton-${index}`} />;
      }
      if (isFeaturedRow(item)) {
        return featuredNews.length === 0 ? (
          <FeaturedCarouselSkeleton />
        ) : (
          <FeaturedCarousel items={featuredNews} onItemPress={handleFeaturedNewsPress} />
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
      loading,
      newsData.length,
      featuredNews,
      handleFeaturedNewsPress,
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

  if (error && newsData.length === 0) {
    return (
      <View style={styles.container}>
        <ServiceUnavailableState onRetry={loadNews} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={
          !loading && newsData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('home.noResults')}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
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
  });
}
