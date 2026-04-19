import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
} from '../services/api';
import { Coin, CoinStats, NewsItem } from '../types';
import { CoinStatSegment } from '../components/CoinStatSegment';
import { CoinPriceChart } from '../components/CoinPriceChart';
import { openInAppBrowser } from '../utils/browser';
import { formatTimeAgo } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
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
  const syncFollowingCoins = useAppStore((state) => state.syncFollowingCoins);

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
        const followPromise = isAuthenticated ? getCoinFollowStats(coinId) : null;

        const secondary = [newsPromise, statsPromise, followPromise].filter(Boolean) as Promise<unknown>[];

        let coinData: Awaited<ReturnType<typeof fetchCoinDetails>>;
        try {
          coinData = await detailsPromise;
        } catch (detailErr) {
          await Promise.allSettled(secondary);
          throw detailErr;
        }

        if (cancelled) return;
        setCoin(coinData);
        setIsFollowing(Boolean(coinData.isFollowing));
        setError(null);
        setLoading(false);

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

  const handleNewsPress = (item: NewsItem) => {
    const url = item.url || item.sourceUrl;
    if (url) openInAppBrowser(url, { barTintColor: c.neutral[900] });
  };

  const handleFollowToggle = async () => {
    if (!coinId || followLoading) return;
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
        await followCoin(coinId);
      } else {
        await unfollowCoin(coinId);
      }
      await syncFollowingCoins();
      const refreshedStats = await getCoinFollowStats(coinId);
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

      <View style={styles.fixedSegment}>
        {hasCharts ? (
          <CoinPriceChart symbol={coin.symbol} />
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>{t('coin.chartsUnavailable')}</Text>
          </View>
        )}
        <CoinStatSegment stats={stats} coinSymbol={coin.symbol} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>{t('coin.relatedNews')}</Text>
          {loadingDetails ? (
            <Text style={styles.loadingDetailText}>{t('coin.refreshingData')}</Text>
          ) : null}
          {news.length === 0 ? (
            <Text style={styles.emptyText}>{t('coin.noRelatedNews')}</Text>
          ) : (
            <View style={styles.newsList}>
              {news.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.newsCard}
                  onPress={() => handleNewsPress(item)}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={t('news.readNewsTitle', { title: item.title })}
                >
                  <View style={styles.newsCardImageContainer}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.newsCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.newsCardImagePlaceholder} />
                    )}
                  </View>
                  <View style={styles.newsCardContent}>
                    <Text style={styles.newsCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.newsCardMeta}>
                      {item.source} • {formatTimeAgo(item.publishedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
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
    fontSize: 32, // larger text matching stitch 'Buy BTC' style
    fontWeight: '700',
    color: tokens.text,
    letterSpacing: -1.0, // tighter tracking like stitch
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.primary[50],
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    borderRadius: br.sm,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary[600],
  },
  coinSymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: tokens.textMuted,
    letterSpacing: 2.0, // wider tracking for symbols like the stitch symbol
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
  },
  scrollContent: {
    paddingHorizontal: s.md,
    paddingBottom: s.xxl,
  },
  fixedSegment: {
    paddingHorizontal: s.md,
    paddingTop: s.lg,
  },
  chartPlaceholder: {
    height: 220,
    backgroundColor: c.neutral[100],
    borderRadius: br.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s.md,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: tokens.textMuted,
    fontWeight: '500',
  },
  newsSection: {
    paddingTop: s.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.neutral[800],
    marginBottom: s.md,
  },
  newsList: {
    paddingBottom: s.xxl,
  },
  newsCard: {
    backgroundColor: tokens.surface,
    borderRadius: br.card,
    marginBottom: s.md,
    ...tokens.shadows.md,
    overflow: 'hidden',
  },
  newsCardImageContainer: {
    width: '100%',
    height: 140,
  },
  newsCardImage: {
    width: '100%',
    height: '100%',
  },
  newsCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: c.neutral[200],
  },
  newsCardContent: {
    padding: s.md,
  },
  newsCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.text,
    lineHeight: 20,
    marginBottom: s.sm,
  },
  newsCardMeta: {
    fontSize: 12,
    color: tokens.textMuted,
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
  },
  loadingDetailText: {
    color: tokens.textMuted,
    fontSize: 12,
    marginTop: -s.xs,
    marginBottom: s.sm,
  },
});
}
