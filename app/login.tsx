import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AuthContainer } from '@/src/components/auth/AuthContainer';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { GoogleButton } from '@/src/components/auth/GoogleButton';
import { getAuthPalette } from '@/src/components/auth/authPalette';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { login, loginWithGoogle } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { trackEvent } from '@/src/utils/trackEvent';

void WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;

const PASSWORD_RESET_URL =
  process.env.EXPO_PUBLIC_PASSWORD_RESET_URL ?? 'https://nayft.com';

const ANDROID_ID = ANDROID_CLIENT_ID?.trim() ?? '';
const IOS_ID = IOS_CLIENT_ID?.trim() ?? '';
const WEB_ID = WEB_CLIENT_ID?.trim() ?? '';

/**
 * `expo-auth-session/providers/google` enforces platform-specific IDs (web requires webClientId).
 * Never call `Google.useAuthRequest` unless the current platform's client ID is configured.
 */
function isGoogleOAuthHookSupportedOnThisPlatform(): boolean {
  switch (Platform.OS) {
    case 'web':
      return WEB_ID.length > 0;
    case 'android':
      return ANDROID_ID.length > 0;
    case 'ios':
      return IOS_ID.length > 0;
    default:
      return WEB_ID.length > 0 || ANDROID_ID.length > 0 || IOS_ID.length > 0;
  }
}

/** Mount only when Expo's Google invariants are satisfied — avoids crashing web without webClientId. */
function LoginGoogleOAuthSection(props: {
  palette: ReturnType<typeof getAuthPalette>;
  passwordLoading: boolean;
  googleLoading: boolean;
  setGoogleLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
}) {
  const { palette, passwordLoading, googleLoading, setGoogleLoading, setError, router, t } = props;

  const googleAuthConfig =
    Platform.OS === 'web'
      ? { webClientId: WEB_ID, scopes: ['openid', 'profile', 'email'] as const }
      : Platform.OS === 'android'
        ? { androidClientId: ANDROID_ID, scopes: ['openid', 'profile', 'email'] as const }
        : { iosClientId: IOS_ID, scopes: ['openid', 'profile', 'email'] as const };

  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    androidClientId:
      'androidClientId' in googleAuthConfig ? googleAuthConfig.androidClientId : undefined,
    iosClientId: 'iosClientId' in googleAuthConfig ? googleAuthConfig.iosClientId : undefined,
    webClientId: 'webClientId' in googleAuthConfig ? googleAuthConfig.webClientId : undefined,
    scopes: [...googleAuthConfig.scopes],
  });

  useEffect(() => {
    let cancelled = false;
    async function consumeGoogle(): Promise<void> {
      const r = googleResponse;
      if (!r || r.type !== 'success') return;

      const params = r.params as Record<string, string | undefined>;
      const idToken =
        r.authentication?.idToken ??
        (typeof params.id_token === 'string' ? params.id_token : undefined);

      if (!idToken) {
        const msg =
          'Google sign-in succeeded but did not return an ID token. Add webClientId / platform client IDs in env.';
        if (!cancelled) setError(msg);
        return;
      }

      try {
        if (!cancelled) {
          setGoogleLoading(true);
          setError(null);
        }
        trackEvent({ featureKey: 'auth', eventType: 'google_login_attempt', metadata: {} });
        await loginWithGoogle(idToken);
        if (!cancelled) router.replace('/(tabs)' as never);
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : t('auth.errorLoginFailed');
        if (!cancelled) setError(m);
      } finally {
        if (!cancelled) setGoogleLoading(false);
      }
    }
    void consumeGoogle();
    return () => {
      cancelled = true;
    };
  }, [googleResponse, router, setError, setGoogleLoading, t]);

  const onGooglePress = async () => {
    if (googleLoading || passwordLoading) return;
    setError(null);
    try {
      await promptGoogle({ showInRecents: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('auth.errorGoogleUnavailable'));
    }
  };

  return (
    <GoogleButton
      palette={palette}
      label={t('auth.continueWithGoogle')}
      onPress={onGooglePress}
      loading={googleLoading}
      disabled={passwordLoading || googleLoading}
    />
  );
}

export default function LoginScreen() {
  const googleConfigured = useMemo(() => isGoogleOAuthHookSupportedOnThisPlatform(), []);

  const { t } = useTranslation();
  const { effectiveScheme } = useAppTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDark = effectiveScheme === 'dark';
  const palette = useMemo(() => getAuthPalette(isDark), [isDark]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const devGoogleWarnedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)' as never);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!__DEV__ || googleConfigured || devGoogleWarnedRef.current) return;
    devGoogleWarnedRef.current = true;
    console.warn(
      Platform.OS === 'web'
        ? '[auth] Set EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB for Continue with Google on web.'
        : '[auth] Set EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID / EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS for native Google login.'
    );
  }, [googleConfigured]);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError(t('auth.errorEnterEmailPassword'));
      return;
    }

    trackEvent({ featureKey: 'auth', eventType: 'login_attempt', metadata: {} });

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
    trackEvent({ featureKey: 'auth', eventType: 'navigate_to_register', metadata: {} });
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

          {googleConfigured ? (
            <LoginGoogleOAuthSection
              palette={palette}
              passwordLoading={loading}
              googleLoading={googleLoading}
              setGoogleLoading={setGoogleLoading}
              setError={setError}
              router={router}
              t={t}
            />
          ) : (
            <GoogleButton
              palette={palette}
              label={t('auth.continueWithGoogle')}
              onPress={() => undefined}
              disabled
              loading={false}
            />
          )}

          {!googleConfigured && !__DEV__ ? (
            <Text style={[styles.subtleFoot, { color: palette.textSecondary }]}>
              {Platform.OS === 'web' ? t('auth.googleUnavailableWeb') : t('auth.googleUnavailable')}
            </Text>
          ) : null}
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
  subtleFoot: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});
