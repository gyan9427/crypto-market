import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AuthContainer } from '@/src/components/auth/AuthContainer';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { GoogleButton } from '@/src/components/auth/GoogleButton';
import { AuthPrivacyLinks } from '@/src/components/auth/AuthPrivacyLinks';
import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { login, loginWithGoogle } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { trackAuthEvent } from '@/src/utils/trackEvent';

const PASSWORD_RESET_URL =
  process.env.EXPO_PUBLIC_PASSWORD_RESET_URL ?? 'https://nayft.com';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDark = effectiveScheme === 'dark';
  const palette = useMemo(() => getAuthPaletteFromTokens(tokens), [tokens]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)' as never);
    }
  }, [isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    if (googleLoading || loading) return;
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      setGoogleLoading(true);
      trackAuthEvent('google_login_attempt');
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        setError(t('auth.errorGoogleUnavailable'));
        return;
      }
      await loginWithGoogle(idToken);
      router.replace('/(tabs)' as never);
    } catch (err: unknown) {
      const code = (err as any)?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error shown
      } else if (code === statusCodes.IN_PROGRESS) {
        // already in progress — ignore
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError(t('auth.googleUnavailable'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.errorGoogleUnavailable'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError(t('auth.errorEnterEmailPassword'));
      return;
    }

    trackAuthEvent('login_attempt');

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      router.replace('/(tabs)' as never);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorLoginFailed'));
    } finally {
      setLoading(false);
    }
  }, [email, password, router, t]);

  const goToRegister = () => {
    trackAuthEvent('navigate_to_register');
    router.push('/register' as never);
  };

  const openForgotPassword = async () => {
    try {
      const url = PASSWORD_RESET_URL.trim();
      const open =
        /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
      await Linking.openURL(open);
    } catch {
      setError(t('auth.errorForgotPasswordOpen'));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <AuthContainer backgroundColor={palette.bg}>
        <AuthHeader
          palette={palette}
          isDark={isDark}
          title={t('auth.welcomeBack')}
          subtitle={t('auth.loginTagline')}
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
          style={styles.section}
        >
          <AuthInput
            palette={palette}
            label={t('auth.phoneOrEmail')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder={t('auth.placeholderPhoneOrEmail')}
            editable={!loading && !googleLoading}
          />

          <AuthInput
            palette={palette}
            label={t('auth.password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secure
            autoComplete="password"
            placeholder={t('auth.placeholderPassword')}
            editable={!loading && !googleLoading}
          />

          <PrimaryButton
            palette={palette}
            title={t('auth.logIn')}
            onPress={handleLogin}
            loading={loading}
            disabled={googleLoading}
            accessibilityLabel={t('auth.logInAccessibility')}
          />

          <GoogleButton
            palette={palette}
            label={t('auth.continueWithGoogle')}
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={loading || googleLoading}
          />

          <AuthPrivacyLinks palette={palette} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).springify()}
          style={styles.footerCol}
        >
          <TouchableOpacity onPress={openForgotPassword} hitSlop={10} accessibilityRole="link">
            <Text style={[styles.link, { color: palette.primaryGreen }]}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.signupRow}>
          <TouchableOpacity onPress={goToRegister} accessibilityRole="button">
            <Text style={[styles.muted, { color: palette.textSecondary }]}>
              {t('auth.footerNoAccount')}
              <Text style={[styles.boldLink, { color: palette.primaryGreen }]}>
                {t('auth.footerSignUp')}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </AuthContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  section: {},
  footerCol: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  signupRow: {
    alignItems: 'center',
    marginBottom: 8,
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
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  muted: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
  },
  boldLink: {
    fontWeight: '600',
  },
});
