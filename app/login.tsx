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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, borderRadius, shadows, typography } from '@/src/theme/theme';
import { login, API_BASE_URL } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { trackEvent } from '@/src/utils/trackEvent';
import { DEFAULT_PUBLIC_API } from '@/src/config/apiBaseUrl';

export default function LoginScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    trackEvent({ featureKey: 'auth', eventType: 'login_attempt', metadata: {} });

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      router.replace('(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    trackEvent({ featureKey: 'auth', eventType: 'navigate_to_register', metadata: {} });
    router.push('register');
  };

  const expoPublicApiBase = useMemo(() => {
    const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (raw && typeof raw === 'string' && raw.trim()) return raw.trim();
    return '(not set — app uses DEFAULT_PUBLIC_API)';
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="auto" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            {error !== 'Please enter your email and password' && (
              <View style={styles.errorDiagnostics}>
                <Text style={styles.errorDiagLabel}>DEFAULT_PUBLIC_API</Text>
                <Text style={styles.errorDiagValue} selectable>
                  {DEFAULT_PUBLIC_API}
                </Text>
                <Text style={styles.errorDiagLabel}>Resolved base URL (used for API calls)</Text>
                <Text style={styles.errorDiagValue} selectable>
                  {API_BASE_URL}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.neutral[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="••••••••"
            placeholderTextColor={colors.neutral[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Log in"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={goToRegister} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerTextHighlight}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.apiConfigCard} accessibilityLabel="API base URL configuration">
        <Text style={styles.apiConfigTitle}>API config (bundle)</Text>
        <Text style={styles.apiConfigLabel}>EXPO_PUBLIC_API_BASE_URL</Text>
        <Text style={styles.apiConfigValue} selectable>
          {expoPublicApiBase}
        </Text>
        <Text style={styles.apiConfigLabel}>DEFAULT_PUBLIC_API</Text>
        <Text style={styles.apiConfigValue} selectable>
          {DEFAULT_PUBLIC_API}
        </Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.xxl,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.button,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  footerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  footerTextHighlight: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.semibold,
  },
  errorBox: {
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error[700],
    fontSize: typography.fontSizes.sm,
  },
  errorDiagnostics: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.error[200],
  },
  errorDiagLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.error[700],
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    opacity: 0.95,
  },
  errorDiagValue: {
    fontSize: typography.fontSizes.xs,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: colors.neutral[900],
    lineHeight: 18,
  },
  apiConfigCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  apiConfigTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  apiConfigLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[500],
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  apiConfigValue: {
    fontSize: typography.fontSizes.xs,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: colors.neutral[800],
    lineHeight: 18,
  },
});

