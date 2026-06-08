import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { PasswordStrengthField } from '@/src/components/auth/PasswordStrengthField';
import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthPrivacyLinks } from '@/src/components/auth/AuthPrivacyLinks';
import { signup } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { usePasswordStrength } from '@/src/hooks/usePasswordStrength';
import { trackAuthEvent } from '@/src/utils/trackEvent';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const styles = useMemo(() => buildRegisterStyles(tokens), [tokens]);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDark = effectiveScheme === 'dark';
  const palette = useMemo(() => getAuthPaletteFromTokens(tokens), [tokens]);
  const scrollRef = useRef<ScrollView>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeToken, setShakeToken] = useState(0);

  const strength = usePasswordStrength(password, { email: email.trim(), username: username.trim() }, { isDark });

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.emailVerified !== true) {
      router.replace('/verify-email' as never);
      return;
    }
    router.replace('/(tabs)' as never);
  }, [isAuthenticated, user?.emailVerified, router]);

  const clearError = useCallback(() => setError(null), []);

  const canSubmit =
    Boolean(username && email && password && confirmPassword) &&
    strength.isAcceptable &&
    password === confirmPassword &&
    !loading;

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError(t('auth.errorFillAll'));
      return;
    }

    if (!strength.isAcceptable) {
      const message =
        strength.level === 'low'
          ? t('auth.errorPasswordAlmost')
          : t('auth.errorPasswordWeak');
      setError(message);
      setShakeToken((v) => v + 1);
      trackAuthEvent('weak_password_attempt', {
        strengthLevel: strength.level === 'strong' ? 'low' : strength.level,
        violationCount: strength.violations.length,
      });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
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
      router.replace('/verify-email' as never);
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
          ref={scrollRef}
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

            <PasswordStrengthField
              palette={palette}
              password={password}
              onChangePassword={(text) => { setPassword(text); clearError(); }}
              confirmPassword={confirmPassword}
              onChangeConfirmPassword={(text) => { setConfirmPassword(text); clearError(); }}
              email={email.trim()}
              username={username.trim()}
              passwordLabel={t('auth.password')}
              confirmLabel={t('auth.confirmPassword')}
              passwordPlaceholder={t('auth.passwordDots')}
              confirmPlaceholder={t('auth.passwordDots')}
              editable={!loading}
              isDark={isDark}
              mismatchHint={t('auth.errorPasswordMismatch')}
              shakeToken={shakeToken}
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel={t('auth.signUpAccessibility')}
              accessibilityState={{ disabled: !canSubmit }}
              style={styles.btnWrapper}
            >
              <LinearGradient
                colors={loading || !canSubmit ? ['#a855f7', '#a855f7'] : ['#a855f7', '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.btn, { opacity: loading || !canSubmit ? 0.5 : 1 }]}
              >
                <Text style={styles.btnText}>{loading ? '…' : t('auth.signUp')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <AuthPrivacyLinks palette={palette} />
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
