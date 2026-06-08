import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { PasswordStrengthField } from '@/src/components/auth/PasswordStrengthField';
import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
import { changePassword } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { usePasswordStrength } from '@/src/hooks/usePasswordStrength';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tokens, effectiveScheme } = useAppTheme();
  const palette = useMemo(() => getAuthPaletteFromTokens(tokens), [tokens]);
  const isDark = effectiveScheme === 'dark';
  const user = useAuthStore((s) => s.user);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeToken, setShakeToken] = useState(0);

  const strength = usePasswordStrength(
    newPassword,
    { username: user?.username, email: user?.email },
    { isDark }
  );

  const clearError = useCallback(() => setError(null), []);

  const canSubmit =
    Boolean(currentPassword && newPassword && confirmPassword) &&
    strength.isAcceptable &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword &&
    !loading;

  const handleSubmit = async () => {
    if (!strength.isAcceptable) {
      setError(
        strength.level === 'low'
          ? t('auth.errorPasswordAlmost')
          : t('auth.errorPasswordWeak')
      );
      setShakeToken((v) => v + 1);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await changePassword(currentPassword, newPassword);
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorPasswordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t('auth.changePasswordTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {t('auth.changePasswordSubtitle')}
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
            label={t('auth.currentPassword')}
            value={currentPassword}
            onChangeText={(text) => { setCurrentPassword(text); clearError(); }}
            secure
            autoCapitalize="none"
            editable={!loading}
          />

          <PasswordStrengthField
            palette={palette}
            password={newPassword}
            onChangePassword={(text) => { setNewPassword(text); clearError(); }}
            confirmPassword={confirmPassword}
            onChangeConfirmPassword={(text) => { setConfirmPassword(text); clearError(); }}
            username={user?.username}
            passwordLabel={t('auth.newPassword')}
            confirmLabel={t('auth.confirmPassword')}
            editable={!loading}
            isDark={isDark}
            mismatchHint={t('auth.errorPasswordMismatch')}
            shakeToken={shakeToken}
          />

          <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} style={styles.btnWrapper}>
            <LinearGradient
              colors={['#a855f7', '#d946ef']}
              style={[styles.btn, { opacity: canSubmit ? 1 : 0.5 }]}
            >
              <Text style={styles.btnText}>
                {loading ? '…' : t('auth.changePasswordSubmit')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  errBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  errText: { fontSize: 13, textAlign: 'center' },
  btnWrapper: { marginTop: 8, borderRadius: 8, overflow: 'hidden' },
  btn: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
