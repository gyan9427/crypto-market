import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { usePortfolioStore } from '@/src/state/usePortfolioStore';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { PortfolioPieChart } from '@/src/components/portfolio/PortfolioPieChart';
import {
  buildPortfolioComposition,
  formatCompositionPct,
  formatCompositionUsd,
} from '@/src/utils/portfolioComposition';

export const PortfolioCompositionScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);

  const holdings = usePortfolioStore((s) => s.holdings);
  const selectedAccount = usePortfolioStore((s) => s.selectedAccount);
  const wallets = usePortfolioStore((s) => s.wallets);
  const exchanges = usePortfolioStore((s) => s.exchanges);

  const composition = useMemo(
    () =>
      buildPortfolioComposition(holdings, selectedAccount, t, wallets, exchanges, {
        maxSlices: null,
      }),
    [holdings, selectedAccount, t, wallets, exchanges]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={tokens.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('portfolio.compositionTitle')}</Text>
          {composition ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {composition.scopeLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!composition ? (
          <Text style={styles.emptyText}>{t('portfolio.compositionEmpty')}</Text>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.totalLabel}>{t('portfolio.compositionTotal')}</Text>
              <Text style={styles.totalValue}>{formatCompositionUsd(composition.totalUsd)}</Text>
              <View style={styles.chartWrap}>
                <PortfolioPieChart slices={composition.slices} size={180} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('portfolio.compositionBreakdown')}</Text>
            {composition.slices.map((slice) => (
              <View key={slice.key} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.swatch, { backgroundColor: slice.color }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.symbol} numberOfLines={1}>
                      {slice.symbol}
                    </Text>
                    <Text style={styles.valueSub}>{formatCompositionUsd(slice.valueUsd)}</Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.pct}>{formatCompositionPct(slice.pct)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(slice.pct, 2)}%`,
                          backgroundColor: slice.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  const cardBg = tokens.isDark ? tokens.surfaceMuted : tokens.surface;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
    },
    backBtn: {
      padding: 8,
      marginRight: 4,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    subtitle: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    summaryCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(255,255,255,0.08)' : tokens.borderSubtle,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    totalValue: {
      fontSize: 28,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      marginTop: 6,
      fontVariant: ['tabular-nums'],
    },
    chartWrap: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textMuted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      gap: 12,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      gap: 10,
    },
    swatch: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    symbol: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    valueSub: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    rowRight: {
      width: 108,
      alignItems: 'flex-end',
    },
    pct: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      marginBottom: 6,
      fontVariant: ['tabular-nums'],
    },
    barTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.08)' : (tokens.colors.neutral?.[100] ?? tokens.surfaceMuted),
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      textAlign: 'center',
      marginTop: 40,
    },
  });
}
