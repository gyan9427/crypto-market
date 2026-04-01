import React, { useState, useEffect } from 'react';
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
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows, typography } from '@/src/theme/theme';
import { login } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { trackEvent } from '@/src/utils/trackEvent';

const OPENING_BG = require('../assets/images/nayft_opening.png');

/** Bottom sheet height as fraction of screen — keeps hero art + overlays visible */
const LOGIN_CARD_HEIGHT_RATIO = 0.44;

const PLACEHOLDER_MUTED = 'rgba(0,0,0,0.5)';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardMaxHeight = Math.round(windowHeight * LOGIN_CARD_HEIGHT_RATIO);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View style={styles.layerRoot}>
        {/* Zone 1: full-bleed art — cover preserves aspect ratio; no stretch */}
        <ImageBackground
          source={OPENING_BG}
          style={styles.bgImage}
          resizeMode="cover"
          imageStyle={styles.bgImageInner}
        />

        {/* Zone 2: readability fade — replaces heavy full-screen blur */}
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(255,255,255,0.42)']}
          start={{ x: 0.5, y: 0.42 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fadeOverlay}
        />

        {/* Zone 3: bottom-aligned form (not vertically centered) */}
        <View style={styles.formColumn}>
          <ScrollView
            style={[styles.scrollView, { maxHeight: cardMaxHeight }]}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.loginCard}>
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
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
                  placeholder="Enter your email"
                  placeholderTextColor={PLACEHOLDER_MUTED}
                  underlineColorAndroid="transparent"
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
                  placeholder="Enter your password"
                  placeholderTextColor={PLACEHOLDER_MUTED}
                  underlineColorAndroid="transparent"
                />
              </View>

              <TouchableOpacity
                style={[styles.buttonTouchable, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Log in"
              >
                <LinearGradient
                  colors={[colors.primary[700], colors.primary[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Log in</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={goToRegister} style={styles.footerLink}>
                <Text style={styles.footerText}>
                  {"Don't have an account? "}
                  <Text style={styles.footerTextHighlight}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  layerRoot: {
    flex: 1,
    position: 'relative',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  /** Ensures cover crops naturally (resizeMode is on ImageBackground) */
  bgImageInner: {
    width: '100%',
    height: '100%',
  },
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  formColumn: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  loginCard: {
    width: '100%',
    alignSelf: 'flex-end',
    alignItems: 'stretch',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  field: {
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: typography.fontWeights.medium,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: spacing.xs,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 6,
    minHeight: 36,
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.25)',
  },
  buttonTouchable: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'stretch',
    ...shadows.sm,
  },
  buttonGradient: {
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
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
    alignItems: 'flex-start',
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
    backgroundColor: 'rgba(254, 226, 226, 0.75)',
    borderRadius: borderRadius.xs,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error[700],
    fontSize: typography.fontSizes.sm,
  },
});
