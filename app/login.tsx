import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  useWindowDimensions,
  Animated,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows, typography } from '@/src/theme/theme';
import { login } from '@/src/services/api';
import { useAuthStore } from '@/src/state/useAuthStore';
import { trackEvent } from '@/src/utils/trackEvent';
import {
  FloatingFieldFocusLayer,
  FLOATING_FIELD_FOCUS_OPEN_DELAY_MS,
  type FloatingFieldFocusLayerRef,
} from '@/src/components/auth/FloatingFieldFocusLayer';

const OPENING_BG = require('../assets/images/nayft_opening.png');

/** Bottom sheet height as fraction of screen — keeps hero art + overlays visible */
const LOGIN_CARD_HEIGHT_RATIO = 0.44;

/** Ignore focus-open briefly after keyboardDidHide to reduce IME/focus races */
const KEYBOARD_SETTLE_MS = 80;

const PLACEHOLDER_MUTED = 'rgba(0,0,0,0.5)';

type ActiveField = 'email' | 'password' | null;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [sourceCenter, setSourceCenter] = useState<{ cx: number; cy: number } | null>(null);

  const emailMeasureRef = useRef<View>(null);
  const passwordMeasureRef = useRef<View>(null);
  const floatingEmailRef = useRef<TextInput>(null);
  const floatingPasswordRef = useRef<TextInput>(null);
  const floatingLayerRef = useRef<FloatingFieldFocusLayerRef>(null);
  /** Shared with FloatingFieldFocusLayer — 0 = base form full strength, 1 = focus overlay active */
  const focusProgress = useRef(new Animated.Value(0)).current;

  const focusOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Soft keyboard visibility from system events */
  const keyboardVisibleRef = useRef(false);
  /** Used to skip opening the overlay immediately after IME dismiss (focus churn) */
  const lastKeyboardHideAtRef = useRef(0);

  const cardMaxHeight = Math.round(windowHeight * LOGIN_CARD_HEIGHT_RATIO);

  const baseFormAnimatedStyle = useMemo(
    () => ({
      opacity: focusProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.16],
      }),
      transform: [
        {
          scale: focusProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.98],
          }),
        },
      ],
    }),
    [focusProgress]
  );

  const handleDismissComplete = useCallback(() => {
    setActiveField(null);
    setSourceCenter(null);
  }, []);

  const openFieldFromMeasure = useCallback((field: 'email' | 'password') => {
    if (floatingLayerRef.current?.isAnimating?.()) return;
    const measureRef = field === 'email' ? emailMeasureRef : passwordMeasureRef;
    measureRef.current?.measureInWindow((x, y, w, h) => {
      setSourceCenter({ cx: x + w / 2, cy: y + h / 2 });
      setActiveField(field);
    });
  }, []);

  const scheduleOpenField = useCallback(
    (field: 'email' | 'password') => {
      if (focusOpenTimerRef.current) {
        clearTimeout(focusOpenTimerRef.current);
        focusOpenTimerRef.current = null;
      }
      focusOpenTimerRef.current = setTimeout(() => {
        focusOpenTimerRef.current = null;
        if (floatingLayerRef.current?.isAnimating?.()) return;
        if (Date.now() - lastKeyboardHideAtRef.current < KEYBOARD_SETTLE_MS) return;
        openFieldFromMeasure(field);
      }, FLOATING_FIELD_FOCUS_OPEN_DELAY_MS);
    },
    [openFieldFromMeasure]
  );

  const onBottomEmailFocus = useCallback(() => {
    scheduleOpenField('email');
  }, [scheduleOpenField]);

  const onBottomPasswordFocus = useCallback(() => {
    scheduleOpenField('password');
  }, [scheduleOpenField]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisibleRef.current = true;
      lastKeyboardHideAtRef.current = 0;
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      lastKeyboardHideAtRef.current = Date.now();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (focusOpenTimerRef.current) {
        clearTimeout(focusOpenTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!activeField) return;
    if (activeField === 'email') {
      floatingEmailRef.current?.focus();
    } else {
      floatingPasswordRef.current?.focus();
    }
  }, [activeField]);

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

  const floatingEmailHidden = activeField === 'email';
  const floatingPasswordHidden = activeField === 'password';

  const inputProps = {
    placeholderTextColor: PLACEHOLDER_MUTED,
    underlineColorAndroid: 'transparent' as const,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.layerRoot}>
        <ImageBackground
          source={OPENING_BG}
          style={styles.bgImage}
          resizeMode="cover"
          imageStyle={styles.bgImageInner}
        />

        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(255,255,255,0.42)']}
          start={{ x: 0.5, y: 0.42 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fadeOverlay}
        />

        <Animated.View style={[styles.formColumn, baseFormAnimatedStyle]}>
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

              <View ref={emailMeasureRef} style={styles.field} collapsable={false}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, floatingEmailHidden && styles.inputHidden]}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={onBottomEmailFocus}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="Enter your email"
                  editable={!floatingEmailHidden}
                  {...inputProps}
                />
              </View>

              <View ref={passwordMeasureRef} style={styles.field} collapsable={false}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, floatingPasswordHidden && styles.inputHidden]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={onBottomPasswordFocus}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Enter your password"
                  editable={!floatingPasswordHidden}
                  {...inputProps}
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
        </Animated.View>

        {activeField && sourceCenter && (
          <FloatingFieldFocusLayer
            ref={floatingLayerRef}
            activeField={activeField}
            sourceCenter={sourceCenter}
            onDismissComplete={handleDismissComplete}
            progress={focusProgress}
          >
            {activeField === 'email' ? (
              <>
                <Text style={styles.floatingLabel}>Email</Text>
                <TextInput
                  ref={floatingEmailRef}
                  style={styles.floatingInput}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => floatingLayerRef.current?.dismiss()}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...inputProps}
                />
              </>
            ) : (
              <>
                <Text style={styles.floatingLabel}>Password</Text>
                <TextInput
                  ref={floatingPasswordRef}
                  style={styles.floatingInput}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => floatingLayerRef.current?.dismiss()}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Enter your password"
                  {...inputProps}
                />
              </>
            )}
          </FloatingFieldFocusLayer>
        )}
      </View>
    </View>
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
    zIndex: 0,
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
  inputHidden: {
    opacity: 0,
  },
  floatingLabel: {
    fontSize: 13,
    fontWeight: typography.fontWeights.medium,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: spacing.xs,
  },
  floatingInput: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    minHeight: 40,
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
