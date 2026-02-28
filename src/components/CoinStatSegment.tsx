import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoinStats } from '../types';
import {
  formatMarketCap,
  formatPrice,
  formatSupplyWithSymbol,
  formatDate,
} from '../utils/format';
import { colors, borderRadius, shadows, spacing, typography } from '../theme/theme';

interface StatCellProps {
  label: string;
  value: string;
}

const StatCell: React.FC<StatCellProps> = ({ label, value }) => (
  <View style={styles.statCell}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
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
  if (!stats) return null;
  const low = stats.low_24h;
  const high = stats.high_24h;
  const current = stats.current_price;
  const hasRange = low != null && high != null && high > low && current != null;
  const fillRatio = hasRange
    ? Math.max(0, Math.min(1, (current - low) / (high - low)))
    : 0;

  const leftColumn: StatCellProps[] = [
    {
      label: 'Market Cap',
      value:
        stats.market_cap != null ? formatMarketCap(stats.market_cap) : '—',
    },
    {
      label: 'Volume 24h',
      value:
        stats.total_volume != null
          ? formatMarketCap(stats.total_volume)
          : '—',
    },
    {
      label: 'Max Supply',
      value: formatSupplyWithSymbol(stats.max_supply, coinSymbol),
    },
    {
      label: 'All Time High',
      value:
        stats.ath != null
          ? (stats.ath_date
              ? `(${formatDate(new Date(stats.ath_date))}) `
              : '') + formatPrice(stats.ath)
          : '—',
    },
    {
      label: 'All Time Low',
      value:
        stats.atl != null
          ? (stats.atl_date
              ? `(${formatDate(new Date(stats.atl_date))}) `
              : '') + formatPrice(stats.atl)
          : '—',
    },
  ];

  const rightColumn: StatCellProps[] = [
    {
      label: 'Fully Diluted Market Cap',
      value:
        stats.fully_diluted_valuation != null
          ? formatMarketCap(stats.fully_diluted_valuation)
          : '—',
    },
    {
      label: 'Circulating Supply',
      value: formatSupplyWithSymbol(stats.circulating_supply, coinSymbol),
    },
    {
      label: 'Total Supply',
      value: formatSupplyWithSymbol(stats.total_supply, coinSymbol),
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Statistics</Text>

      <View style={styles.divider} />

      <View style={styles.lowHighSection}>
        <View style={styles.lowHighLabelRow}>
          <Text style={styles.lowHighLabel}>Low / High</Text>
          <View style={styles.badge24h}>
            <Text style={styles.badgeText}>24h</Text>
          </View>
        </View>
        <View style={styles.lowHighValues}>
          <Text style={styles.lowHighValue}>
            {low != null ? formatPrice(low) : '—'}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${fillRatio * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.lowHighValue}>
            {high != null ? formatPrice(high) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsGrid}>
        <View style={styles.column}>
          {leftColumn.map((cell) => (
            <StatCell key={cell.label} label={cell.label} value={cell.value} />
          ))}
        </View>
        <View style={styles.column}>
          {rightColumn.map((cell) => (
            <StatCell key={cell.label} label={cell.label} value={cell.value} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.md,
  },
  lowHighSection: {
    marginBottom: spacing.xs,
  },
  lowHighLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  lowHighLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  badge24h: {
    backgroundColor: colors.neutral[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  lowHighValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lowHighValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[900],
    minWidth: 70,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  column: {
    flex: 1,
  },
  statCell: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[900],
  },
});
