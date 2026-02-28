import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { fetchCoinDetails, fetchCoinNews, fetchCoinStats } from '../services/api';
import { Coin, CoinStats, NewsItem } from '../types';
import { CoinStatSegment } from '../components/CoinStatSegment';
import { openInAppBrowser } from '../utils/browser';
import { formatTimeAgo } from '../utils/format';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';

export const CoinProfileScreen: React.FC = () => {
  const { coinId } = useLocalSearchParams<{ coinId: string }>();
  const router = useRouter();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coinId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [coinData, newsData, statsData] = await Promise.all([
          fetchCoinDetails(coinId),
          fetchCoinNews(coinId),
          fetchCoinStats(coinId),
        ]);
        setCoin(coinData);
        setNews(newsData);
        setStats(statsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load coin profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coinId]);

  const handleNewsPress = (item: NewsItem) => {
    const url = item.url || item.sourceUrl;
    if (url) openInAppBrowser(url);
  };

  if (loading && !coin) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (error && !coin) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!coin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
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
                  <Trophy size={14} color={colors.primary[600]} />
                  <Text style={styles.rankText}>
                    #{stats.market_cap_rank.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.coinSymbol}>@{coin.symbol.toLowerCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.newsSection}>
          <CoinStatSegment stats={stats} coinSymbol={coin.symbol} />
          <Text style={styles.sectionTitle}>Related news</Text>
          {news.length === 0 ? (
            <Text style={styles.emptyText}>No related news for this coin.</Text>
          ) : (
            <View style={styles.newsList}>
              {news.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.newsCard}
                  onPress={() => handleNewsPress(item)}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={`Read: ${item.title}`}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
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
    backgroundColor: colors.primary[500],
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
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  coinName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  coinSymbol: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  newsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  newsList: {
    paddingBottom: spacing.xxl,
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    ...shadows.md,
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
    backgroundColor: colors.neutral[200],
  },
  newsCardContent: {
    padding: spacing.md,
  },
  newsCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  newsCardMeta: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    color: colors.error[500],
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    padding: spacing.md,
  },
  retryText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.neutral[500],
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
