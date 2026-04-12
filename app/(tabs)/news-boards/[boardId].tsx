import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BookmarkX } from 'lucide-react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { NewsCard } from '@/src/components/NewsCard';
import { NewsCardSkeleton } from '@/src/components/NewsCardSkeleton';
import { NewsDetailModal } from '@/src/screens/NewsDetailModal';
import { ServiceUnavailableState } from '@/src/components/ServiceUnavailableState';
import { getBoardNews } from '@/src/services/api';
import { NewsItem } from '@/src/types';

export default function BoardDetailScreen() {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildBoardDetailScreenStyles(tokens), [tokens]);
  const c = tokens.colors;

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
      setError(err.message || t('newsBoards.failedLoadArticles'));
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
          <ServiceUnavailableState onRetry={fetchNews} />
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
              colors={[c.primary[500]]}
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
                <BookmarkX size={48} color={c.neutral[300]} />
                <Text style={styles.emptyTitle}>{t('newsBoards.emptyArticles')}</Text>
                <Text style={styles.emptySubtitle}>{t('newsBoards.emptyBoardDetailHint')}</Text>
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

function buildBoardDetailScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: s.xl,
    },
    listContent: {
      paddingTop: s.md,
      paddingBottom: 100,
      flexGrow: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: s.xl,
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: typo.fontSizes.lg,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[700],
      marginTop: s.md,
      marginBottom: s.sm,
    },
    emptySubtitle: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
