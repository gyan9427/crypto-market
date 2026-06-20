import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { notificationsApi } from '@/src/services/notificationsApi';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type CategoryKey = 'news' | 'market' | 'portfolio';

export default function NotificationPreferencesScreen() {
  const { tokens } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [categories, setCategories] = useState<Record<CategoryKey, boolean>>({
    news: true,
    market: true,
    portfolio: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prefs = (await notificationsApi.getPreferences()) as {
        global?: { enabled?: boolean };
        channelPrefs?: { push?: { enabled?: boolean } };
        categoryPrefs?: Record<string, { enabled?: boolean }>;
      };
      setGlobalEnabled(prefs.global?.enabled !== false);
      setPushEnabled(prefs.channelPrefs?.push?.enabled !== false);
      setCategories({
        news: prefs.categoryPrefs?.news?.enabled !== false,
        market: prefs.categoryPrefs?.market?.enabled !== false,
        portfolio: prefs.categoryPrefs?.portfolio?.enabled !== false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      await notificationsApi.patchPreferences(patch);
    } finally {
      setSaving(false);
    }
  };

  const onGlobal = async (v: boolean) => {
    setGlobalEnabled(v);
    await save({ global: { enabled: v } });
  };

  const onPush = async (v: boolean) => {
    setPushEnabled(v);
    await save({ channelPrefs: { push: { enabled: v } } });
  };

  const onCategory = async (key: CategoryKey, v: boolean) => {
    setCategories((c) => ({ ...c, [key]: v }));
    await save({ categoryPrefs: { [key]: { enabled: v } } });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: tokens.bg }]}>
        <ActivityIndicator color={tokens.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/notifications' as never)}>
          <Text style={[styles.link, { color: tokens.colors?.primary?.[500] ?? tokens.text }]}>
            View notification history
          </Text>
        </TouchableOpacity>

        <Row
          label="All notifications"
          value={globalEnabled}
          onValueChange={onGlobal}
          disabled={saving}
          tokens={tokens}
        />
        <Row
          label="Push notifications"
          value={pushEnabled}
          onValueChange={onPush}
          disabled={saving}
          tokens={tokens}
        />

        <Text style={[styles.section, { color: tokens.textMuted }]}>Categories</Text>
        <Row
          label="News"
          value={categories.news}
          onValueChange={(v) => onCategory('news', v)}
          disabled={saving}
          tokens={tokens}
        />
        <Row
          label="Market alerts"
          value={categories.market}
          onValueChange={(v) => onCategory('market', v)}
          disabled={saving}
          tokens={tokens}
        />
        <Row
          label="Portfolio alerts"
          value={categories.portfolio}
          onValueChange={(v) => onCategory('portfolio', v)}
          disabled={saving}
          tokens={tokens}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  onValueChange,
  disabled,
  tokens,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled: boolean;
  tokens: { text: string; border: string };
}) {
  return (
    <View style={[styles.row, { borderBottomColor: tokens.border }]}>
      <Text style={[styles.rowLabel, { color: tokens.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  link: { marginBottom: 20, fontSize: 15, fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 16 },
});
