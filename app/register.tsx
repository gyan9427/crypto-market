import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { signup } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const styles = useMemo(() => buildRegisterStyles(tokens), [tokens]);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const c = tokens.colors;

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <Text style={styles.subtitle}>{t('auth.signUpSubtitle')}</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.username')}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder={t('auth.placeholderUsername')}
            placeholderTextColor={c.neutral[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder={t('auth.placeholderEmailExample')}
            placeholderTextColor={c.neutral[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder={t('auth.passwordDots')}
            placeholderTextColor={c.neutral[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder={t('auth.passwordDots')}
            placeholderTextColor={c.neutral[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signUpAccessibility')}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.signUp')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={goToLogin} style={styles.footerLink}>
          <Text style={styles.footerText}>
            {t('auth.footerHasAccount')}
            <Text style={styles.footerTextHighlight}>{t('auth.footerLogIn')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function buildRegisterStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const { spacing: s, borderRadius: br, typography: ty } = tokens;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
      justifyContent: 'center',
      paddingHorizontal: s.lg,
    },
    card: {
      backgroundColor: tokens.bgElevated,
      borderRadius: br.card,
      padding: s.xxl,
      ...tokens.shadows.lg,
      borderWidth: tokens.isDark ? 1 : 0,
      borderColor: tokens.borderSubtle,
    },
    title: {
      fontSize: ty.fontSizes.xxxl,
      fontWeight: ty.fontWeights.bold,
      color: tokens.textStrong,
      marginBottom: s.sm,
      letterSpacing: -0.5,
      fontFamily: tokens.typography.fontFamilies.sansBold,
    },
    subtitle: {
      fontSize: ty.fontSizes.lg,
      color: tokens.textMuted,
      marginBottom: s.xl,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    field: {
      marginBottom: s.md,
    },
    label: {
      fontSize: ty.fontSizes.sm,
      fontWeight: ty.fontWeights.medium,
      color: tokens.textMuted,
      marginBottom: s.sm,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
    },
    input: {
      borderWidth: 1,
      borderColor: tokens.inputBorder,
      borderRadius: br.md,
      paddingHorizontal: s.lg,
      paddingVertical: s.md,
      fontSize: ty.fontSizes.md,
      color: tokens.text,
      backgroundColor: tokens.inputBg,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    button: {
      marginTop: s.md,
      backgroundColor: c.primary[500],
      borderRadius: br.button,
      paddingVertical: s.lg,
      alignItems: 'center',
      justifyContent: 'center',
      ...tokens.shadows.md,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: '#fff',
      fontSize: ty.fontSizes.md,
      fontWeight: ty.fontWeights.semibold,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    footerLink: {
      marginTop: s.lg,
      alignItems: 'center',
    },
    footerText: {
      fontSize: ty.fontSizes.sm,
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    footerTextHighlight: {
      color: c.primary[600],
      fontWeight: ty.fontWeights.semibold,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    errorBox: {
      backgroundColor: c.error[50],
      borderRadius: br.sm,
      padding: s.sm,
      marginBottom: s.md,
    },
    errorText: {
      color: c.error[700],
      fontSize: ty.fontSizes.sm,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
  });
}
