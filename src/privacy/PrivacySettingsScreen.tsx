import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useConsentStore } from './consentStore';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';
import { patchUserPreferences } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://nayft.com/privacy';

export function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const analyticsConsent = useConsentStore((s) => s.analyticsConsent);
  const personalizationConsent = useConsentStore((s) => s.personalizationConsent);
  const setAnalyticsConsent = useConsentStore((s) => s.setAnalyticsConsent);
  const setPersonalizationConsent = useConsentStore((s) => s.setPersonalizationConsent);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const syncPersonalizationToServer = (enabled: boolean): void => {
    if (!isAuthenticated) return;
    void patchUserPreferences({ personalizationEnabled: enabled }).catch(() => {});
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: tokens.bg }]}>
      <Text style={[styles.title, { color: tokens.colors.neutral[50] }]}>
        {t('privacy.settingsTitle', 'Privacy settings')}
      </Text>

      <View style={[styles.row, { borderColor: tokens.colors.neutral[700] }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: tokens.colors.neutral[100] }]}>
            {t('privacy.analyticsLabel', 'Analytics')}
          </Text>
          <Text style={[styles.rowDesc, { color: tokens.colors.neutral[400] }]}>
            {t('privacy.analyticsDesc', 'Help improve NAYFT with anonymous usage events')}
          </Text>
        </View>
        <Switch
          value={analyticsConsent}
          onValueChange={(v) => void setAnalyticsConsent(v)}
        />
      </View>

      <View style={[styles.row, { borderColor: tokens.colors.neutral[700] }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: tokens.colors.neutral[100] }]}>
            {t('privacy.personalizationLabel', 'Personalization')}
          </Text>
          <Text style={[styles.rowDesc, { color: tokens.colors.neutral[400] }]}>
            {t('privacy.personalizationDesc', 'Rank feed using your interests and portfolio context')}
          </Text>
        </View>
        <Switch
          value={personalizationConsent}
          onValueChange={(v) => {
            void setPersonalizationConsent(v);
            syncPersonalizationToServer(v);
            if (!v) void useFeedIntentStore.getState().clearAll();
          }}
        />
      </View>

      <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.linkBtn}>
        <Text style={{ color: tokens.colors.primary[400] }}>
          {t('privacy.viewPolicy', 'View privacy policy')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  rowDesc: { fontSize: 13, lineHeight: 18 },
  linkBtn: { marginTop: 24, paddingVertical: 12 },
});
