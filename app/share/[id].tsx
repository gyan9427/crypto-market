import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { NewsDetailModal } from '@/src/screens/NewsDetailModal';
import { fetchNewsDetails } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { usePendingShareStore } from '@/src/state/usePendingShareStore';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { NewsItem } from '@/src/types';
import type { ThemeTokens } from '@/src/theme/theme';

export default function ShareArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleId = typeof id === 'string' ? id.trim() : '';
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = React.useMemo(() => buildStyles(tokens), [tokens]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const emailVerified = useAuthStore((s) => s.user?.emailVerified === true);
  const setPendingArticleId = usePendingShareStore((s) => s.setArticleId);

  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!articleId) {
      setError('Missing article id');
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setPendingArticleId(articleId);
      router.replace('/login' as Href);
      return;
    }

    if (!emailVerified) {
      setPendingArticleId(articleId);
      router.replace('/verify-email' as Href);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchNewsDetails(articleId)
      .then((item) => {
        if (!cancelled) {
          setNewsItem(item);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load article');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [articleId, isAuthenticated, emailVerified, router, setPendingArticleId]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as Href);
  }, [router]);

  if (!articleId || !isAuthenticated || !emailVerified) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        <Text style={styles.loadingText}>{t('news.loading', { defaultValue: 'Loading article…' })}</Text>
      </View>
    );
  }

  if (error || !newsItem) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Article not found'}</Text>
      </View>
    );
  }

  return <NewsDetailModal newsItem={newsItem} onClose={handleClose} />;
}

function buildStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: tokens.bg,
      paddingHorizontal: 24,
    },
    loadingText: {
      marginTop: 12,
      color: tokens.textMuted,
      fontSize: 14,
    },
    errorText: {
      color: tokens.textMuted,
      fontSize: 15,
      textAlign: 'center',
    },
  });
}
