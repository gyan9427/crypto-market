import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Bookmark, BookmarkX } from 'lucide-react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ServiceUnavailableState } from '@/src/components/ServiceUnavailableState';
import { useAppStore } from '@/src/state/useAppStore';
import { getNewsBoards } from '@/src/services/api';
import { NewsBoard } from '@/src/types';

export default function NewsBoardsScreen() {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildNewsBoardsScreenStyles(tokens), [tokens]);
  const c = tokens.colors;

  const router = useRouter();
  const storeBoards = useAppStore((s) => s.boards);
  const setBoards = useAppStore((s) => s.setBoards);

  const [loading, setLoading] = useState(storeBoards.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    try {
      setError(null);
      const boards = await getNewsBoards();
      setBoards(boards);
    } catch (err: any) {
      setError(err.message || t('newsBoards.failedLoadBoards'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBoards();
  };

  const handleBoardPress = (board: NewsBoard) => {
    router.push({
      pathname: '/news-boards/[boardId]',
      params: { boardId: board.id, name: board.name },
    } as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator color={c.primary[500]} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {error ? (
        <View style={styles.centered}>
          <ServiceUnavailableState onRetry={fetchBoards} />
        </View>
      ) : (
        <FlatList
          data={storeBoards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[c.primary[500]]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.boardRow}
              onPress={() => handleBoardPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.boardIconWrap}>
                <Bookmark size={20} color={c.primary[500]} fill={c.primary[100]} />
              </View>
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{item.name}</Text>
                <Text style={styles.boardCount}>
                  {item.newsIds.length}{' '}
                  {item.newsIds.length === 1 ? t('newsBoards.articleSingular') : t('newsBoards.articlePlural')}
                </Text>
              </View>
              <ChevronRight size={18} color={c.neutral[400]} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookmarkX size={48} color={c.neutral[300]} />
              <Text style={styles.emptyTitle}>{t('newsBoards.emptyBoards')}</Text>
              <Text style={styles.emptySubtitle}>{t('newsBoards.emptyBoardsHint')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function buildNewsBoardsScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
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
    },
    listContent: {
      paddingHorizontal: s.lg,
      paddingTop: s.md,
      paddingBottom: s.xl,
      flexGrow: 1,
    },
    boardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.surface,
      borderRadius: br.card,
      padding: s.md,
      marginBottom: s.sm,
      ...tokens.shadows.sm,
    },
    boardIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary[50],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: s.md,
    },
    boardInfo: {
      flex: 1,
    },
    boardName: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      marginBottom: 2,
    },
    boardCount: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
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
