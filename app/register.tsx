import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { signup } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const styles = useMemo(() => buildRegisterStyles(tokens), [tokens]);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDark = effectiveScheme === 'dark';
  const palette = useMemo(() => getAuthPaletteFromTokens(tokens), [tokens]);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)' as never);
    }
  }, [isAuthenticated, router]);

  const clearError = useCallback(() => setError(null), []);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError(t('auth.errorFillAll'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errorPasswordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signup(email.trim(), password, username.trim());
      router.replace('/(tabs)' as never);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorSignUpFailed'));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.push('/login' as never);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <AuthHeader
            palette={palette}
            isDark={isDark}
            title={t('auth.createAccount')}
            subtitle={t('auth.signUpSubtitle')}
          />

          {error ? (
            <Animated.View
              entering={FadeInDown.delay(40).springify()}
              style={[styles.errBox, { backgroundColor: palette.errorBg }]}
            >
              <Text style={[styles.errText, { color: palette.errorText }]}>{error}</Text>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(80).springify().damping(24)}
          >
            <AuthInput
              palette={palette}
              label={t('auth.username')}
              value={username}
              onChangeText={(text) => { setUsername(text); clearError(); }}
              autoCapitalize="none"
              placeholder={t('auth.placeholderUsername')}
              editable={!loading}
            />

            <AuthInput
              palette={palette}
              label={t('auth.email')}
              value={email}
              onChangeText={(text) => { setEmail(text); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder={t('auth.placeholderEmailExample')}
              editable={!loading}
            />

            <AuthInput
              palette={palette}
              label={t('auth.password')}
              value={password}
              onChangeText={(text) => { setPassword(text); clearError(); }}
              secure
              autoCapitalize="none"
              placeholder={t('auth.passwordDots')}
              editable={!loading}
            />

            <AuthInput
              palette={palette}
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); clearError(); }}
              secure
              autoCapitalize="none"
              placeholder={t('auth.passwordDots')}
              editable={!loading}
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t('auth.signUpAccessibility')}
              style={styles.btnWrapper}
            >
              <LinearGradient
                colors={loading ? ['#a855f7', '#a855f7'] : ['#a855f7', '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.btn, { opacity: loading ? 0.65 : 1 }]}
              >
                <Text style={styles.btnText}>{loading ? '…' : t('auth.signUp')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.footerLink}
          >
            <TouchableOpacity onPress={goToLogin} accessibilityRole="button">
              <Text style={[styles.footerText, { color: palette.textSecondary }]}>
                {t('auth.footerHasAccount')}
                <Text style={[styles.footerTextHighlight, { color: palette.primary }]}>
                  {t('auth.footerLogIn')}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function buildRegisterStyles(tokens: ThemeTokens) {
  const { spacing: s, typography: ty } = tokens;
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 40,
    },
    errBox: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.30)',
    },
    errText: {
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },
    btnWrapper: {
      marginTop: s.sm,
      marginBottom: 12,
      borderRadius: 8,
      overflow: 'hidden',
      ...(tokens.isDark
        ? {}
        : ({
            shadowColor: '#a855f7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.30,
            shadowRadius: 14,
          } as Record<string, unknown>)),
    },
    btn: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    btnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.02,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    footerLink: {
      marginTop: s.lg,
      alignItems: 'center',
    },
    footerText: {
      fontSize: ty.fontSizes.sm,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    footerTextHighlight: {
      fontWeight: '600' as const,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
  });
}
