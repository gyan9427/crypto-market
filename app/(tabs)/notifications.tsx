import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useNotificationStore } from '@/src/state/useNotificationStore';
import { notificationsApi, type NotificationItem } from '@/src/services/notificationsApi';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AppText } from '@/src/design-system/primitives/AppText';
import { useDesignSystem } from '@/src/design-system/hooks/useDesignSystem';

export default function NotificationsScreen() {
  const { tokens } = useAppTheme();
  const { enabled: dsV2 } = useDesignSystem();
  const authed = useAuthStore((s) => s.isAuthenticated);
  const { items, mergeFromFetch, hasMore, nextCursor, loading } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    if (!authed) return;
    useNotificationStore.setState({ loading: true });
    try {
      const res = await notificationsApi.list({ limit: 25, cursor });
      mergeFromFetch(res);
    } finally {
      useNotificationStore.setState({ loading: false });
    }
  }, [authed, mergeFromFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const onEnd = useCallback(() => {
    if (hasMore && nextCursor && !loading) void load(nextCursor);
  }, [hasMore, nextCursor, loading, load]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    useNotificationStore.getState().patchOne(id, { status: 'read', readAt: new Date().toISOString() });
    const u = await notificationsApi.getUnreadCount();
    useNotificationStore.getState().setUnreadCount(u.unreadCount);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: tokens.border }]}
      onPress={() => item.status === 'unread' && void markRead(item.id)}
      activeOpacity={0.7}
    >
      {dsV2 ? (
        <>
          <AppText variant="heading-s" color="strong">
            {item.title}
          </AppText>
          <AppText variant="body-m" color="muted" numberOfLines={3}>
            {item.body}
          </AppText>
          <AppText variant="caption" color="muted" style={styles.metaSpacing}>
            {item.category} · {item.priority}
            {item.status === 'unread' ? ' · unread' : ''}
          </AppText>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: tokens.text }]}>{item.title}</Text>
          <Text style={[styles.body, { color: tokens.textMuted }]} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={[styles.meta, { color: tokens.textMuted }]}>
            {item.category} · {item.priority}
            {item.status === 'unread' ? ' · unread' : ''}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  if (!authed) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: tokens.bg }]}>
        <Text style={{ color: tokens.textMuted }}>Sign in to view notifications.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg }} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEnd}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: tokens.textMuted }]}>No notifications yet.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 14 },
  meta: { fontSize: 11, marginTop: 6 },
  metaSpacing: { marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 48 },
});
