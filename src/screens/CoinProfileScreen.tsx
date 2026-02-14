import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { fetchCoinDetails, fetchCoinNews } from '../services/api';
import { Coin, NewsItem } from '../types';
import { NewsCard } from '../components/NewsCard';
import { colors, spacing } from '../theme/theme';

export const CoinProfileScreen: React.FC = () => {
  const { coinId } = useLocalSearchParams<{ coinId: string }>();
  const router = useRouter();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coinId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [coinData, newsData] = await Promise.all([
          fetchCoinDetails(coinId),
          fetchCoinNews(coinId),
        ]);
        setCoin(coinData);
        setNews(newsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load coin profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coinId]);

  const handleCoinPress = (id: string) => {
    router.push(`/coin/${id}` as never);
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
            {coin.logo ? (
              <Image
                source={{ uri: coin.logo }}
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
            <Text style={styles.coinName} numberOfLines={1}>
              {coin.name} - {coin.symbol}
            </Text>
            <Text style={styles.coinSymbol}>@{coin.symbol.toLowerCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.newsSection}>
        <Text style={styles.sectionTitle}>Related news</Text>
        {news.length === 0 ? (
          <Text style={styles.emptyText}>No related news for this coin.</Text>
        ) : (
          <FlatList
            data={news}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.newsList}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <NewsCard
                  item={item}
                  variant="grid"
                  onCoinPress={handleCoinPress}
            />
              </View>
            )}
          />
        )}
      </View>
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
  coinName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  coinSymbol: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 2,
  },
  newsSection: {
    flex: 1,
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
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
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
