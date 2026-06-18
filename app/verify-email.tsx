import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  AccessibilityInfo,
  AppState,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AuthContainer } from '@/src/components/auth/AuthContainer';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { OtpInput } from '@/src/components/auth/OtpInput';
import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
import { useAuthStore } from '@/src/state/useAuthStore';
import {
  getVerificationStatus,
  resendVerification,
  verifyEmail,
} from '@/src/services/api';

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@');
  const masked = local.length > 1 ? `${local[0]}***` : '***';
  return `${masked}@${domain}`;
}

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const palette = useMemo(() => getAuthPaletteFromTokens(tokens), [tokens]);
  const isDark = effectiveScheme === 'dark';
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getVerificationStatus();
      if (status.emailVerified) {
        router.replace('/(tabs)' as never);
        return;
      }
      setCooldown(status.cooldownSecondsRemaining ?? 0);
    } catch {
      /* ignore */
    }
  }, [router]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    refreshStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshStatus();
    });
    return () => sub.remove();
  }, [refreshStatus]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (code?: string) => {
    const value = code ?? otp;
    if (value.length !== 6 || loading) return;
    try {
      setLoading(true);
      setError(null);
      Keyboard.dismiss();
      const result = await verifyEmail(value);
      await setToken(result.token);
      setUser(result.user);
      setSuccess(t('auth.verification.success'));
      AccessibilityInfo.announceForAccessibility(t('auth.verification.success'));
      router.replace('/(tabs)' as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.verification.invalid');
      if (msg.includes('expired')) {
        setError(t('auth.verification.expired'));
      } else if (msg.includes('attempt')) {
        setError(t('auth.verification.locked'));
      } else {
        setError(t('auth.verification.invalid'));
      }
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    try {
      setResendLoading(true);
      setError(null);
      const result = await resendVerification();
      setSuccess(
        result.emailDeliveryStatus === 'queued'
          ? t('auth.verification.resent')
          : 'Verification email queued is unavailable in this environment'
      );
      setCooldown(60);
      AccessibilityInfo.announceForAccessibility(t('auth.verification.resent'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('429') || msg.toLowerCase().includes('resend')) {
        setError(t('auth.verification.resendLimit'));
      } else {
        setError(t('auth.verification.resendFailed'));
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthContainer backgroundColor={palette.bg}>
      <AuthHeader
        palette={palette}
        isDark={isDark}
        title={t('auth.verification.title')}
        subtitle={t('auth.verification.sent')}
      />

      <Text style={[styles.maskedEmail, { color: palette.textSecondary }]}>
        {maskEmail(user?.email)}
      </Text>

      <Text style={[styles.trustCopy, { color: palette.textSecondary }]}>
        {t('auth.verification.trustCopy')}
      </Text>

      {error ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown}
          style={[styles.banner, { backgroundColor: palette.errorBg, borderColor: 'rgba(239,68,68,0.3)' }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={[styles.bannerText, { color: palette.errorText }]}>{error}</Text>
        </Animated.View>
      ) : null}

      {success ? (
        <Animated.View
          style={[styles.banner, { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' }]}
        >
          <Text style={[styles.bannerText, { color: isDark ? '#4ade80' : '#16a34a' }]}>{success}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.otpWrap}>
        <OtpInput
          palette={palette}
          value={otp}
          onChange={setOtp}
          onComplete={(code) => void handleVerify(code)}
          disabled={loading}
          reducedMotion={reducedMotion}
        />
      </View>

      <Text style={[styles.expiryHint, { color: palette.textSecondary }]}>
        {t('auth.verification.expiryHint')}
      </Text>

      {__DEV__ ? (
        <Text style={[styles.devHint, { color: palette.textSecondary }]}>
          {t('auth.verification.devHint')}
        </Text>
      ) : null}

      <PrimaryButton
        palette={palette}
        title={loading ? t('auth.verification.verifying') : t('auth.verification.submit')}
        onPress={() => void handleVerify()}
        disabled={loading || otp.length !== 6}
        loading={loading}
      />

      <Pressable
        onPress={() => void handleResend()}
        disabled={cooldown > 0 || resendLoading}
        style={styles.resendBtn}
        accessibilityRole="button"
        accessibilityState={{ disabled: cooldown > 0 || resendLoading }}
      >
        <Text style={[styles.resendText, { color: cooldown > 0 ? palette.textSecondary : palette.primary }]}>
          {cooldown > 0
            ? t('auth.verification.resendCooldown', { seconds: cooldown })
            : t('auth.verification.resend')}
        </Text>
      </Pressable>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  maskedEmail: {
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  trustCopy: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  otpWrap: {
    marginBottom: 16,
  },
  expiryHint: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  devHint: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 24,
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
