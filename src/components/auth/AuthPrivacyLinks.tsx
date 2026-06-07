import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AuthPalette } from './authPalette';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://nayft.com/privacy';

interface AuthPrivacyLinksProps {
  palette: AuthPalette;
}

export function AuthPrivacyLinks({ palette }: AuthPrivacyLinksProps) {
  const { t } = useTranslation();

  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_URL);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: palette.textSecondary }]}>
        {t('auth.legalPrefix', 'By continuing, you agree to our')}{' '}
        <Text
          style={[styles.link, { color: palette.primaryGreen }]}
          onPress={openPrivacyPolicy}
          accessibilityRole="link"
        >
          {t('auth.privacyPolicy', 'Privacy Policy')}
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
