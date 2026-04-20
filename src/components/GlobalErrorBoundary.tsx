import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  const iconBg = tokens.isDark ? 'rgba(168, 85, 247, 0.18)' : c.primary[50];
  const devBg = tokens.isDark ? 'rgba(255, 255, 255, 0.06)' : c.neutral[100];

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    gradient: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: s.lg,
      paddingVertical: s.xl,
    },
    card: {
      backgroundColor: tokens.surface,
      borderRadius: br.card,
      padding: s.lg,
      ...tokens.shadows.lg,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
    },
    iconWrap: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: iconBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: s.lg,
    },
    title: {
      fontFamily: typo.fontFamilies.sansBold,
      fontSize: typo.fontSizes.xxl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: s.sm,
    },
    subtitle: {
      fontFamily: typo.fontFamilies.sans,
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.regular,
      color: tokens.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: s.xl,
    },
    primaryBtn: {
      backgroundColor: c.primary[500],
      borderRadius: br.button,
      paddingVertical: s.md,
      paddingHorizontal: s.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: s.sm,
    },
    primaryBtnPressed: {
      opacity: 0.92,
    },
    primaryBtnText: {
      fontFamily: typo.fontFamilies.sansSemiBold,
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: '#fff',
    },
    secondaryBtn: {
      marginTop: s.md,
      borderRadius: br.button,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: s.md,
      paddingHorizontal: s.lg,
      alignItems: 'center',
    },
    secondaryBtnText: {
      fontFamily: typo.fontFamilies.sansMedium,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.text,
    },
    devBox: {
      marginTop: s.lg,
      maxHeight: 160,
      borderRadius: br.sm,
      backgroundColor: devBg,
      padding: s.md,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
    },
    devLabel: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.error[600],
      marginBottom: s.xs,
    },
    devText: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: 11,
      color: tokens.textMuted,
    },
    accentBlob: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      opacity: 0.12,
      top: -80,
      right: -100,
      backgroundColor: c.primary[400],
    },
    accentBlob2: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      opacity: 0.08,
      bottom: 40,
      left: -60,
      backgroundColor: c.accent[400],
    },
  });
}

type FallbackProps = {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
};

function ErrorFallback({ error, errorInfo, onReset }: FallbackProps) {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = React.useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;

  const gradientEnd = tokens.isDark ? tokens.bgElevated : tokens.surface;
  const gradientMid = tokens.isDark ? '#1a0a2e' : c.primary[50];

  const handleHardReload = () => {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
      const w = globalThis as typeof globalThis & { location?: { reload: () => void } };
      w.location?.reload();
      return;
    }
    onReset();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient
        colors={[c.primary[900], gradientMid, gradientEnd]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.accentBlob} />
        <View style={styles.accentBlob2} />
        <View style={styles.center}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <AlertTriangle
                size={36}
                color={tokens.isDark ? c.primary[400] : c.primary[600]}
                strokeWidth={2}
              />
            </View>
            <Text style={styles.title}>{t('errorBoundary.title')}</Text>
            <Text style={styles.subtitle}>{t('errorBoundary.subtitle')}</Text>

            <Pressable
              onPress={onReset}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('errorBoundary.tryAgain')}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('errorBoundary.tryAgain')}</Text>
            </Pressable>

            {Platform.OS === 'web' ? (
              <Pressable
                onPress={handleHardReload}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('errorBoundary.reloadApp')}
              >
                <Text style={styles.secondaryBtnText}>{t('errorBoundary.reloadApp')}</Text>
              </Pressable>
            ) : null}

            {__DEV__ ? (
              <ScrollView style={styles.devBox} nestedScrollEnabled>
                <Text style={styles.devLabel}>{t('errorBoundary.devDetails')}</Text>
                <Text style={styles.devText} selectable>
                  {error.message}
                  {errorInfo?.componentStack
                    ? `\n\n${errorInfo.componentStack.slice(0, 1200)}`
                    : ''}
                </Text>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (__DEV__) {
      console.error('[GlobalErrorBoundary]', error, errorInfo.componentStack);
    }
  }

  private handleReset = (): void => {
    this.setState({ error: null, errorInfo: null });
  };

  render(): ReactNode {
    const { error, errorInfo } = this.state;
    if (error) {
      return (
        <ErrorFallback error={error} errorInfo={errorInfo} onReset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}
