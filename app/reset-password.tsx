import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { PasswordStrengthField } from '@/src/components/auth/PasswordStrengthField';
import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
/**
 * Scaffold for future in-app password reset flow.
 * Backend reset endpoint is not yet available.
 */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const palette = useMemo(() => getAuthPaletteFromTokens(tokens), [tokens]);
  const isDark = effectiveScheme === 'dark';

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error] = useState<string | null>(t('auth.resetPasswordUnavailable'));

  const clearError = useCallback(() => {}, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t('auth.resetPasswordTitle')}
          </Text>

          {error ? (
            <Animated.View
              entering={FadeInDown}
              style={[styles.errBox, { backgroundColor: palette.errorBg }]}
            >
              <Text style={[styles.errText, { color: palette.errorText }]}>{error}</Text>
            </Animated.View>
          ) : null}

          <AuthInput
            palette={palette}
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AuthInput
            palette={palette}
            label={t('auth.resetToken')}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />

          <PasswordStrengthField
            palette={palette}
            password={newPassword}
            onChangePassword={(text) => { setNewPassword(text); clearError(); }}
            confirmPassword={confirmPassword}
            onChangeConfirmPassword={setConfirmPassword}
            email={email.trim()}
            passwordLabel={t('auth.newPassword')}
            confirmLabel={t('auth.confirmPassword')}
            isDark={isDark}
            mismatchHint={t('auth.errorPasswordMismatch')}
            editable={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  errBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  errText: { fontSize: 13, textAlign: 'center' },
});
