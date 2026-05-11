import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react-native';
import {
  fetchCoinDetails,
  fetchCoinNews,
  fetchCoinStats,
  followCoin,
  unfollowCoin,
  getCoinFollowStats,
  toggleReaction,
} from '../services/api';
import { Coin, CoinStats, NewsItem, ReactionType } from '../types';
import { CoinStatSegment } from '../components/CoinStatSegment';
import { CoinPriceChart } from '../components/CoinPriceChart';
import { NewsCard } from '../components/NewsCard';
import { NewsCardSkeleton } from '../components/NewsCardSkeleton';
import { SaveToBoardModal } from '../components/SaveToBoardModal';
import { CommentTray } from '../components/CommentTray';
import { NewsDetailModal } from './NewsDetailModal';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { colors } from '@/src/theme/colors';
import { formatPrice, formatPercentage } from '../utils/format';
import { useAppStore } from '../state/useAppStore';
import { useAuthStore } from '../state/useAuthStore';
import { useHasFeature } from '../utils/features';

export const CoinProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildCoinProfileScreenStyles(tokens), [tokens]);
  const c = tokens.colors;

  const { coinId } = useLocalSearchParams<{ coinId: string }>();
  const router = useRouter();
  const hasFollow = useHasFeature('follow');
  const hasCharts = useHasFeature('charts');
  const [coin, setCoin] = useState<Coin | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);

  const syncFollowingCoins = useAppStore((state) => state.syncFollowingCoins);
  const setReaction = useAppStore((state) => state.setReaction);
  const newsReactions = useAppStore((state) => state.newsReactions);
  const boards = useAppStore((state) => state.boards);

  useEffect(() => {
    if (!coinId) return;

    // Drop previous coin immediately when `coinId` changes so we never flash stale data
    // while `fetchCoinDetails` is in flight (same screen instance on param change).
    setCoin(null);
    setNews([]);
    setStats(null);
    setError(null);
    setFollowersCount(null);
    setIsFollowing(false);
    setLoading(true);
    setLoadingDetails(true);

    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    let cancelled = false;
    const load = async () => {
      const loadStart = Date.now();
      try {
        // Fire all requests together; unblock header as soon as profile returns.
        const detailsPromise = fetchCoinDetails(coinId);
        const newsPromise = fetchCoinNews(coinId);
        const statsPromise = fetchCoinStats(coinId);

        let coinData: Awaited<ReturnType<typeof fetchCoinDetails>>;
        try {
          coinData = await detailsPromise;
        } catch (detailErr) {
          await Promise.allSettled([newsPromise, statsPromise]);
          throw detailErr;
        }

        if (cancelled) return;
        setCoin(coinData);
        setIsFollowing(Boolean(coinData.isFollowing));
        setError(null);
        setLoading(false);

        const followKey = coinData.id;
        const followPromise = isAuthenticated ? getCoinFollowStats(followKey) : null;
        const secondary = [newsPromise, statsPromise, followPromise].filter(Boolean) as Promise<unknown>[];

        const settled = await Promise.allSettled(secondary);
        if (cancelled) return;

        const newsResult = settled[0] as PromiseSettledResult<Awaited<ReturnType<typeof fetchCoinNews>>>;
        const statsResult = settled[1] as PromiseSettledResult<Awaited<ReturnType<typeof fetchCoinStats>>>;
        if (newsResult.status === 'fulfilled') {
          setNews(newsResult.value);
        } else {
          console.warn('Failed to load coin news:', newsResult.reason);
        }
        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        } else {
          console.warn('Failed to load coin stats:', statsResult.reason);
        }
        if (isAuthenticated && settled[2]) {
          const followResult = settled[2] as PromiseSettledResult<
            Awaited<ReturnType<typeof getCoinFollowStats>>
          >;
          if (followResult.status === 'fulfilled') {
            setFollowersCount(followResult.value.followersCount ?? null);
          } else {
            console.warn('Failed to load coin followers count:', followResult.reason);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || t('errors.failedToLoadCoin'));
          setCoin(null);
          setLoading(false);
        }
      } finally {
        console.log('[CoinProfile] load settled in', Date.now() - loadStart, 'ms', coinId);
        if (!cancelled) {
          setLoading(false);
          setLoadingDetails(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [coinId]);

  const newsForFeed = useMemo(() => {
    const savedToBoard = (id: string) => boards.some((board) => board.newsIds.includes(id));
    return news.map((item) => ({
      ...item,
      userReaction: newsReactions[item.id] ?? item.userReaction ?? null,
      isSaved: savedToBoard(item.id) || Boolean(item.isSaved),
    }));
  }, [news, newsReactions, boards]);

  const openNewsDetailById = useCallback(
    (newsId: string) => {
      const newsItem = newsForFeed.find((item) => item.id === newsId);
      if (!newsItem) return;

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
    },
    [newsForFeed]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  }, []);

  const handleReact = useCallback(
    async (newsId: string, type: ReactionType) => {
      const currentReaction = newsReactions[newsId] ?? null;
      const newReaction = currentReaction === type ? null : type;
      setReaction(newsId, newReaction);

      const optimisticUpdate = (item: NewsItem): NewsItem => {
        if (item.id !== newsId) return item;
        const prev = {
          ...(item.reactions ?? {
            appreciate: 0,
            insightful: 0,
            bullish: 0,
            risk: 0,
            deepDive: 0,
            debatable: 0,
            total: 0,
          }),
        };
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

      setNews((prev) => prev.map(optimisticUpdate));

      try {
        const result = await toggleReaction(newsId, type);
        setReaction(newsId, result.userReaction);
        setNews((prev) =>
          prev.map((item) =>
            item.id === newsId
              ? { ...item, reactions: result.reactions, userReaction: result.userReaction }
              : item
          )
        );
      } catch (toggleErr) {
        setReaction(newsId, currentReaction);
        setNews((prev) =>
          prev.map((item) =>
            item.id === newsId ? { ...item, userReaction: currentReaction } : item
          )
        );
        console.error('Failed to toggle reaction:', toggleErr);
      }
    },
    [newsReactions, setReaction]
  );

  const handleSave = useCallback((newsId: string) => {
    setSavingNewsId(newsId);
  }, []);

  const handleSaved = useCallback((newsId: string, saveCount: number) => {
    setNews((prev) =>
      prev.map((item) => (item.id === newsId ? { ...item, isSaved: true, saveCount } : item))
    );
    setSavingNewsId(null);
  }, []);

  const handleComment = useCallback((newsId: string) => {
    setCommentingNewsId(newsId);
  }, []);

  const handleCommentCountChange = useCallback((newsId: string, count: number) => {
    setNews((prev) =>
      prev.map((item) => (item.id === newsId ? { ...item, comments: count } : item))
    );
  }, []);

  const handleShare = useCallback((newsId: string) => {
    console.log('Share:', newsId);
  }, []);

  const handleCoinPress = useCallback(
    (targetCoinId: string) => {
      router.push(`/coin/${targetCoinId}` as never);
    },
    [router]
  );

  const handleFollowToggle = async () => {
    if (!coinId || !coin || followLoading) return;
    const followTargetId = coin.id;
    const nextFollowing = !isFollowing;
    const prevFollowers = followersCount;

    setFollowLoading(true);
    setIsFollowing(nextFollowing);
    setFollowersCount((current) => {
      if (current == null) return current;
      return nextFollowing ? current + 1 : Math.max(0, current - 1);
    });

    try {
      if (nextFollowing) {
        await followCoin(followTargetId);
      } else {
        await unfollowCoin(followTargetId);
      }
      await syncFollowingCoins();
      const refreshedStats = await getCoinFollowStats(followTargetId);
      setFollowersCount(refreshedStats.followersCount ?? prevFollowers);
    } catch (toggleError) {
      setIsFollowing(!nextFollowing);
      setFollowersCount(prevFollowers);
      console.warn('Failed to toggle follow status:', toggleError);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading && !coin) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={c.primary[500]} />
      </View>
    );
  }

  if (error && !coin) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryText}>{t('coin.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!coin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {(stats?.image ?? coin.logo) ? (
              <Image
                source={{ uri: stats?.image ?? coin.logo }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{coin.symbol[0] || '?'}</Text>
              </View>
            )}
          </View>
          <View style={styles.titleContainer}>
            <View style={styles.coinNameRow}>
              <Text style={styles.coinName} numberOfLines={1}>
                {coin.name} - {coin.symbol}
              </Text>
              {stats?.market_cap_rank != null && (
                <View style={styles.rankBadge}>
                  <Trophy size={14} color={c.primary[600]} />
                  <Text style={styles.rankText}>
                    #{stats.market_cap_rank.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.coinSymbol}>@{coin.symbol.toLowerCase()}</Text>
            {hasFollow && typeof followersCount === 'number' && (
              <Text style={styles.followersText}>
                {t('coin.followersCount', { count: followersCount })}
              </Text>
            )}
          </View>
          {hasFollow && (
            <TouchableOpacity
              onPress={handleFollowToggle}
              style={[styles.followButton, isFollowing && styles.followingButton]}
              activeOpacity={0.8}
              disabled={followLoading}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {followLoading ? t('common.ellipsis') : isFollowing ? t('coin.following') : t('coin.follow')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartStatsPad}>
          {hasCharts ? (
            <CoinPriceChart symbol={coin.symbol} />
          ) : (
            <View style={styles.chartFallback}>
              <Text style={styles.chartFallbackPrice}>{formatPrice(coin.price)}</Text>
              <Text style={styles.chartFallbackLabel}>24h change</Text>
              <Text style={[
                styles.chartFallbackChange,
                coin.change24h >= 0 ? styles.chartFallbackPositive : styles.chartFallbackNegative,
              ]}>
                {formatPercentage(coin.change24h)}
              </Text>
              <Text style={styles.chartFallbackUnavailable}>Chart unavailable</Text>
            </View>
          )}
          <CoinStatSegment stats={stats} coinSymbol={coin.symbol} />
        </View>

        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>{t('coin.relatedNews')}</Text>
          {loadingDetails && news.length === 0 ? (
            <>
              <Text style={styles.loadingDetailText}>{t('coin.refreshingData')}</Text>
              {[0, 1, 2].map((i) => (
                <NewsCardSkeleton key={`coin-news-skel-${i}`} />
              ))}
            </>
          ) : newsForFeed.length === 0 ? (
            <Text style={styles.emptyText}>{t('coin.noRelatedNews')}</Text>
          ) : (
            newsForFeed.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onReact={handleReact}
                onComment={handleComment}
                onShare={handleShare}
                onSave={handleSave}
                onCoinPress={handleCoinPress}
                onPress={openNewsDetailById}
              />
            ))
          )}
        </View>
      </ScrollView>

      {selectedNews ? (
        <Modal visible={isDetailVisible} animationType="slide" onRequestClose={handleCloseDetail}>
          <NewsDetailModal newsItem={selectedNews} onClose={handleCloseDetail} />
        </Modal>
      ) : null}

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
            ? (newsForFeed.find((n) => n.id === commentingNewsId)?.comments ?? 0)
            : 0
        }
        onClose={() => setCommentingNewsId(null)}
        onCountChange={handleCommentCountChange}
      />
    </View>
  );
};

function buildCoinProfileScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    paddingVertical: s.lg,
    paddingTop: s.xl,
    backgroundColor: tokens.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.borderSubtle,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: s.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  titleContainer: {
    flex: 1,
  },
  coinNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    flexWrap: 'wrap',
  },
  coinName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -1.0,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent.positiveSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.positive,
  },
  coinSymbol: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  followersText: {
    marginTop: s.xs,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.textMuted,
  },
  followButton: {
    borderWidth: 1,
    borderColor: c.primary[500],
    borderRadius: br.button,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    marginLeft: s.sm,
    backgroundColor: c.primary[500],
  },
  followingButton: {
    borderColor: c.neutral[300],
    backgroundColor: tokens.surface,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  followingButtonText: {
    color: c.neutral[700],
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: s.xxl,
    flexGrow: 1,
  },
  chartStatsPad: {
    paddingHorizontal: s.md,
    paddingTop: s.lg,
  },
  chartFallback: {
    padding: s.lg,
    marginBottom: s.md,
  },
  chartFallbackPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  chartFallbackLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: s.xs,
  },
  chartFallbackChange: {
    fontSize: 12,
    marginTop: 2,
  },
  chartFallbackPositive: {
    color: colors.accent.positive,
  },
  chartFallbackNegative: {
    color: colors.accent.negative,
  },
  chartFallbackUnavailable: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: s.sm,
  },
  newsSection: {
    paddingTop: s.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.neutral[800],
    marginBottom: s.md,
    marginHorizontal: s.md,
  },
  errorText: {
    color: c.error[500],
    fontSize: 16,
    textAlign: 'center',
    marginBottom: s.md,
  },
  retryButton: {
    padding: s.md,
  },
  retryText: {
    color: c.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: tokens.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: s.lg,
    marginHorizontal: s.md,
  },
  loadingDetailText: {
    color: tokens.textMuted,
    fontSize: 12,
    marginTop: -s.xs,
    marginBottom: s.sm,
    marginHorizontal: s.md,
  },
});
}
