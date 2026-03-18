import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { BookmarkX } from 'lucide-react-native';
import { colors, spacing, typography } from '@/src/theme/theme';
import { NewsCard } from '@/src/components/NewsCard';
import { NewsCardSkeleton } from '@/src/components/NewsCardSkeleton';
import { NewsDetailModal } from '@/src/screens/NewsDetailModal';
import { getBoardNews } from '@/src/services/api';
import { NewsItem } from '@/src/types';

export default function BoardDetailScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string; name: string }>();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const fetchNews = async () => {
    if (!boardId) return;
    try {
      setError(null);
      const articles = await getBoardNews(boardId);
      setNews(articles);
    } catch (err: any) {
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [boardId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const handleNewsPress = (newsId: string) => {
    const item = news.find((n) => n.id === newsId);
    if (item) {
      setSelectedNews(item);
      setIsDetailVisible(true);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchNews}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={loading ? Array(4).fill(null) : news}
          keyExtractor={(item, index) => item?.id ?? `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary[500]]}
            />
          }
          renderItem={({ item, index }) => {
            if (loading) {
              return <NewsCardSkeleton key={`skeleton-${index}`} />;
            }
            return (
              <NewsCard
                item={item}
                onPress={handleNewsPress}
              />
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <BookmarkX size={48} color={colors.neutral[300]} />
                <Text style={styles.emptyTitle}>No articles here</Text>
                <Text style={styles.emptySubtitle}>
                  Articles you save to this board will appear here.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {selectedNews && (
        <Modal
          visible={isDetailVisible}
          animationType="slide"
          onRequestClose={handleCloseDetail}
        >
          <NewsDetailModal newsItem={selectedNews} onClose={handleCloseDetail} />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error[600],
    fontSize: typography.fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryText: {
    color: colors.primary[500],
    fontSize: typography.fontSizes.sm,
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
