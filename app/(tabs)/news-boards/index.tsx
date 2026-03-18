import React, { useEffect, useState } from 'react';
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
import { ChevronRight, Bookmark, BookmarkX } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/src/theme/theme';
import { useAppStore } from '@/src/state/useAppStore';
import { getNewsBoards } from '@/src/services/api';
import { NewsBoard } from '@/src/types';

export default function NewsBoardsScreen() {
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
      setError(err.message || 'Failed to load boards');
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
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchBoards}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
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
              colors={[colors.primary[500]]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.boardRow}
              onPress={() => handleBoardPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.boardIconWrap}>
                <Bookmark size={20} color={colors.primary[500]} fill={colors.primary[100]} />
              </View>
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{item.name}</Text>
                <Text style={styles.boardCount}>
                  {item.newsIds.length}{' '}
                  {item.newsIds.length === 1 ? 'article' : 'articles'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookmarkX size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No boards yet</Text>
              <Text style={styles.emptySubtitle}>
                Save articles to boards by tapping the bookmark icon on any news card.
              </Text>
            </View>
          }
        />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  boardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  boardInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  boardCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
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
