import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Share,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FileWarning, RefreshCw, Copy, Share2 } from 'lucide-react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { getThemeTokens } from '@/src/theme/theme';
import { useAppStore } from '@/src/state/useAppStore';
import {
  buildIncidentReport,
  formatIncidentClipboard,
  type ErrorSource,
  type IncidentReport,
} from '@/src/errors/incidentReport';
import { setGlobalErrorListener } from '@/src/errors/errorBoundaryBridge';
import { installGlobalErrorHandlers } from '@/src/errors/installGlobalErrorHandlers';
import { getMarketUiPalette } from '@/src/theme/chartPalette';

const HEADLINE_COUNT = 6;

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  source: ErrorSource;
};

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  const ui = getMarketUiPalette(tokens);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: tokens.bg },
    gradient: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: s.lg, paddingVertical: s.xl },
    bureauLabel: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: 10,
      fontWeight: typo.fontWeights.semibold,
      letterSpacing: 3.2,
      color: tokens.isDark ? c.primary[300] : c.primary[700],
      textAlign: 'center',
      marginBottom: s.md,
      opacity: 0.9,
    },
    card: {
      backgroundColor: tokens.surface,
      borderRadius: br.card,
      padding: s.lg,
      ...tokens.shadows.lg,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      overflow: 'hidden',
    },
    cardSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: c.primary[500],
      opacity: 0.85,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: s.lg,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: ui.errorBoundaryIconBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: ui.errorBoundaryIconBorder,
    },
    wordmark: {
      fontFamily: typo.fontFamilies.sansBold,
      fontSize: typo.fontSizes.lg,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      letterSpacing: 1.5,
    },
    wordmarkAccent: { color: c.primary[500] },
    incidentPanel: {
      backgroundColor: ui.errorBoundaryPanelBg,
      borderRadius: br.md,
      padding: s.md,
      marginBottom: s.lg,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
    },
    incidentLabel: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: 10,
      letterSpacing: 1.6,
      color: tokens.textMuted,
      marginBottom: 4,
    },
    incidentId: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      letterSpacing: 0.5,
    },
    incidentMeta: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: 10,
      color: tokens.textMuted,
      marginTop: 6,
    },
    title: {
      fontFamily: typo.fontFamilies.sansBold,
      fontSize: typo.fontSizes.xl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      letterSpacing: -0.4,
      lineHeight: 30,
      marginBottom: s.sm,
    },
    quip: {
      fontFamily: typo.fontFamilies.sans,
      fontSize: typo.fontSizes.md,
      color: tokens.isDark ? c.primary[200] : c.primary[800],
      lineHeight: 22,
      marginBottom: s.md,
      fontStyle: 'italic',
    },
    reassurance: {
      fontFamily: typo.fontFamilies.sans,
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      lineHeight: 21,
      marginBottom: s.lg,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: s.xs,
      marginBottom: s.lg,
    },
    statusPill: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: br.pill,
      backgroundColor: ui.errorBoundaryStatusOkBg,
      borderWidth: 1,
      borderColor: ui.errorBoundaryStatusOkBorder,
    },
    statusPillMuted: {
      backgroundColor: ui.errorBoundaryStatusMutedBg,
      borderColor: tokens.borderSubtle,
    },
    statusText: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: 9,
      letterSpacing: 1.2,
      color: tokens.isDark ? c.success[500] : c.success[600],
      fontWeight: typo.fontWeights.semibold,
    },
    statusTextMuted: {
      color: tokens.textMuted,
    },
    primaryBtn: {
      backgroundColor: c.primary[600],
      borderRadius: br.button,
      paddingVertical: s.md,
      paddingHorizontal: s.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: s.sm,
    },
    primaryBtnPressed: { opacity: 0.9 },
    primaryBtnText: {
      fontFamily: typo.fontFamilies.sansSemiBold,
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: c.white,
    },
    secondaryRow: {
      flexDirection: 'row',
      gap: s.sm,
      marginTop: s.md,
    },
    secondaryBtn: {
      flex: 1,
      borderRadius: br.button,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: s.md,
      paddingHorizontal: s.sm,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryBtnText: {
      fontFamily: typo.fontFamilies.sansMedium,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.text,
    },
    copiedHint: {
      marginTop: s.sm,
      textAlign: 'center',
      fontFamily: typo.fontFamilies.mono,
      fontSize: 10,
      color: c.success[500],
      letterSpacing: 0.6,
    },
    accentBlob: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      opacity: 0.1,
      top: -100,
      right: -120,
      backgroundColor: c.primary[400],
    },
    accentBlob2: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      opacity: 0.07,
      bottom: 24,
      left: -80,
      backgroundColor: c.accent[400],
    },
  });
}

async function copyIncidentToClipboard(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }
  try {
    await Share.share({ message: text });
    return true;
  } catch {
    return false;
  }
}

type FallbackProps = {
  report: IncidentReport;
  onReset: () => void;
};

function useIncidentThemeTokens(): ThemeTokens {
  const systemScheme = useColorScheme();
  const preference = useAppStore((s) => s.themePreference);
  const isDark = React.useMemo(() => {
    if (preference === 'dark') return true;
    if (preference === 'light') return false;
    return systemScheme === 'dark';
  }, [preference, systemScheme]);
  return React.useMemo(() => getThemeTokens(isDark), [isDark]);
}

function ErrorIncidentFallback({ report, onReset }: FallbackProps) {
  const { t } = useTranslation();
  const tokens = useIncidentThemeTokens();
  const styles = React.useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;
  const ui = React.useMemo(() => getMarketUiPalette(tokens), [tokens]);
  const [copied, setCopied] = React.useState(false);

  const headlineKey = `errorBoundary.headlines.${report.headlineIndex}` as const;
  const quipKey = `errorBoundary.quips.${report.headlineIndex}` as const;

  const gradientEnd = tokens.isDark ? tokens.bgElevated : tokens.surface;
  const gradientMid = ui.errorBoundaryGradientMid;

  const handleHardReload = () => {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
      const w = globalThis as typeof globalThis & { location?: { reload: () => void } };
      w.location?.reload();
      return;
    }
    onReset();
  };

  const handleCopyRef = async () => {
    const ok = await copyIncidentToClipboard(formatIncidentClipboard(report));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const sourceLabel = t(`errorBoundary.sources.${report.source}`, {
    defaultValue: report.source.toUpperCase(),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient
        colors={[tokens.isDark ? tokens.bg : c.primary[900], gradientMid, gradientEnd]}
        locations={[0, 0.38, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.accentBlob} />
        <View style={styles.accentBlob2} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.bureauLabel}>{t('errorBoundary.bureau')}</Text>

          <View style={styles.card}>
            <View style={styles.cardSheen} />
            <View style={styles.iconRow}>
              <View style={styles.iconWrap}>
                <FileWarning
                  size={28}
                  color={tokens.isDark ? c.primary[300] : c.primary[600]}
                  strokeWidth={1.75}
                />
              </View>
              <Text style={styles.wordmark}>
                NAY<Text style={styles.wordmarkAccent}>FT</Text>
              </Text>
            </View>

            <View style={styles.incidentPanel}>
              <Text style={styles.incidentLabel}>{t('errorBoundary.incidentLabel')}</Text>
              <Text style={styles.incidentId} selectable>
                {report.id}
              </Text>
              <Text style={styles.incidentMeta}>
                {sourceLabel} · {new Date(report.occurredAt).toLocaleString()}
              </Text>
            </View>

            <Text style={styles.title}>{t(headlineKey)}</Text>
            <Text style={styles.quip}>{t(quipKey)}</Text>
            <Text style={styles.reassurance}>{t('errorBoundary.reassurance')}</Text>

            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{t('errorBoundary.statusContained')}</Text>
              </View>
              <View style={[styles.statusPill, styles.statusPillMuted]}>
                <Text style={[styles.statusText, styles.statusTextMuted]}>
                  {t('errorBoundary.statusSession')}
                </Text>
              </View>
              <View style={[styles.statusPill, styles.statusPillMuted]}>
                <Text style={[styles.statusText, styles.statusTextMuted]}>
                  {t('errorBoundary.statusNonFatal')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onReset}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('errorBoundary.tryAgain')}
            >
              <RefreshCw size={18} color={c.white} />
              <Text style={styles.primaryBtnText}>{t('errorBoundary.tryAgain')}</Text>
            </Pressable>

            <View style={styles.secondaryRow}>
              <Pressable
                onPress={handleCopyRef}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('errorBoundary.copyRef')}
              >
                <Copy size={16} color={tokens.text} />
                <Text style={styles.secondaryBtnText}>{t('errorBoundary.copyRef')}</Text>
              </Pressable>
              {Platform.OS === 'web' ? (
                <Pressable
                  onPress={handleHardReload}
                  style={styles.secondaryBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('errorBoundary.reloadApp')}
                >
                  <Share2 size={16} color={tokens.text} />
                  <Text style={styles.secondaryBtnText}>{t('errorBoundary.reloadApp')}</Text>
                </Pressable>
              ) : null}
            </View>

            {copied ? (
              <Text style={styles.copiedHint}>{t('errorBoundary.copiedRef')}</Text>
            ) : null}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null, source: 'react' };
  }

  componentDidMount(): void {
    installGlobalErrorHandlers();
    setGlobalErrorListener(this.handleExternalError);
  }

  componentWillUnmount(): void {
    setGlobalErrorListener(null);
  }

  private handleExternalError = (error: Error, source: ErrorSource): void => {
    this.setState({ error, errorInfo: null, source });
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, source: 'react' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo, source: 'react' });
    if (__DEV__) {
      console.error('[GlobalErrorBoundary]', error.message, error, errorInfo.componentStack);
    }
  }

  private handleReset = (): void => {
    this.setState({ error: null, errorInfo: null, source: 'react' });
  };

  render(): ReactNode {
    const { error, errorInfo, source } = this.state;
    if (error) {
      const report = buildIncidentReport(
        error,
        source,
        errorInfo?.componentStack ?? undefined,
        HEADLINE_COUNT
      );
      return <ErrorIncidentFallback report={report} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
