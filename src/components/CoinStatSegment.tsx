import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CoinStats } from '../types';
import {
  formatMarketCap,
  formatPrice,
  formatSupplyWithSymbol,
  formatDate,
} from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
// @ts-expect-error Metro resolves SkiaProgressBar.{ios,android,web}; tsc has no extension map
import { SkiaProgressBar } from './SkiaProgressBar';

type CoinStatStyles = ReturnType<typeof buildCoinStatSegmentStyles>;

interface StatCellProps {
  label: string;
  value: string;
  dateRight?: string;
  styles: CoinStatStyles;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, dateRight, styles }) => (
  <View style={styles.statCell}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.statValueRow}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      {dateRight != null && (
        <Text style={styles.statDateRight} numberOfLines={1}>
          {dateRight}
        </Text>
      )}
    </View>
  </View>
);

interface CoinStatSegmentProps {
  stats: CoinStats | null;
  coinSymbol: string;
}

export const CoinStatSegment: React.FC<CoinStatSegmentProps> = ({
  stats,
  coinSymbol,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildCoinStatSegmentStyles(tokens), [tokens]);
  const c = tokens.colors;

  if (!stats) return null;
  const low = stats.low_24h;
  const high = stats.high_24h;
  const current = stats.current_price;
  const hasRange = low != null && high != null && high > low && current != null;
  const fillRatio = hasRange
    ? Math.max(0, Math.min(1, (current - low) / (high - low)))
    : 0;

  const leftColumn: Omit<StatCellProps, 'styles'>[] = useMemo(
    () => [
      {
        label: t('coin.statMarketCap'),
        value: stats.market_cap != null ? formatMarketCap(stats.market_cap) : '—',
      },
      {
        label: t('coin.statVolume24h'),
        value:
          stats.total_volume != null ? formatMarketCap(stats.total_volume) : '—',
      },
      {
        label: t('coin.statMaxSupply'),
        value: formatSupplyWithSymbol(stats.max_supply, coinSymbol),
      },
      {
        label: t('coin.statAth'),
        value: stats.ath != null ? formatPrice(stats.ath) : '—',
        dateRight:
          stats.ath_date != null
            ? `(${formatDate(new Date(stats.ath_date))})`
            : undefined,
      },
      {
        label: t('coin.statAtl'),
        value: stats.atl != null ? formatPrice(stats.atl) : '—',
        dateRight:
          stats.atl_date != null
            ? `(${formatDate(new Date(stats.atl_date))})`
            : undefined,
      },
    ],
    [stats, coinSymbol, t]
  );

  const rightColumn: Omit<StatCellProps, 'styles'>[] = useMemo(
    () => [
      {
        label: t('coin.statFullyDiluted'),
        value:
          stats.fully_diluted_valuation != null
            ? formatMarketCap(stats.fully_diluted_valuation)
            : '—',
      },
      {
        label: t('coin.statCirculatingSupply'),
        value: formatSupplyWithSymbol(stats.circulating_supply, coinSymbol),
      },
      {
        label: t('coin.statTotalSupply'),
        value: formatSupplyWithSymbol(stats.total_supply, coinSymbol),
      },
    ],
    [stats, coinSymbol, t]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('coin.statistics')}</Text>

      <View style={styles.divider} />

      <View style={styles.lowHighSection}>
        <View style={styles.lowHighLabelRow}>
          <Text style={styles.lowHighLabel}>{t('coin.lowHigh')}</Text>
          <View style={styles.badge24h}>
            <Text style={styles.badgeText}>{t('coin.period24h')}</Text>
          </View>
        </View>
        <View style={styles.lowHighValues}>
          <Text style={styles.lowHighValue}>
            {low != null ? formatPrice(low) : '—'}
          </Text>
          <SkiaProgressBar
            fillRatio={fillRatio}
            trackColor={c.neutral[200]}
            fillColor={c.primary[500]}
          />
          <Text style={styles.lowHighValue}>
            {high != null ? formatPrice(high) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsGrid}>
        <View style={styles.column}>
          {leftColumn.map((cell) => (
            <StatCell
              key={cell.label}
              label={cell.label}
              value={cell.value}
              dateRight={cell.dateRight}
              styles={styles}
            />
          ))}
        </View>
        <View style={styles.column}>
          {rightColumn.map((cell) => (
            <StatCell
              key={cell.label}
              label={cell.label}
              value={cell.value}
              dateRight={cell.dateRight}
              styles={styles}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

function buildCoinStatSegmentStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: br.card,
      padding: s.md,
      marginBottom: s.md,
      ...tokens.shadows.md,
    },
    title: {
      fontSize: typo.fontSizes.lg,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    divider: {
      height: 1,
      backgroundColor: tokens.borderSubtle,
      marginVertical: s.md,
    },
    lowHighSection: {
      marginBottom: s.xs,
    },
    lowHighLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      marginBottom: s.sm,
    },
    lowHighLabel: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    badge24h: {
      backgroundColor: c.neutral[200],
      paddingHorizontal: s.sm,
      paddingVertical: 2,
      borderRadius: br.xs,
    },
    badgeText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[700],
    },
    lowHighValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
    },
    lowHighValue: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.text,
      minWidth: 70,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: s.lg,
    },
    column: {
      flex: 1,
    },
    statCell: {
      paddingVertical: s.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.neutral[100],
    },
    statLabel: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      marginBottom: s.sm,
    },
    statValueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: s.sm,
    },
    statValue: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.text,
      flexShrink: 1,
    },
    statDateRight: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      flexShrink: 0,
    },
  });
}
