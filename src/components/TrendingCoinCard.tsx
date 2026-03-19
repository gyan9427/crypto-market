import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingCoin } from '../types';
import { formatPrice, formatPercentage } from '../utils/format';
import { colors, spacing, semantic, typography, borderRadius } from '../theme/theme';
import { SparklineChart } from './SparklineChart';
import { useKlinesCache } from '../hooks/useKlinesCache';

interface TrendingCoinCardProps {
  coin: TrendingCoin;
  onPress?: (coinId: string) => void;
}

function areTrendingCoinCardPropsEqual(prev: TrendingCoinCardProps, next: TrendingCoinCardProps): boolean {
  const a = prev.coin;
  const b = next.coin;
  return a.id === b.id && a.symbol === b.symbol && a.price === b.price && a.change24h === b.change24h && a.rank === b.rank;
}

export const TrendingCoinCard = React.memo<TrendingCoinCardProps>(({ coin, onPress }) => {
  const isPositive = coin.change24h >= 0;
  const sparklineData = useKlinesCache(coin.symbol, '1d', 48);
  const sparklineColor = isPositive ? colors.success[500] : colors.danger[500];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(coin.id)}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${formatPrice(coin.price)}`}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <View style={styles.symbolBadge}>
          <Text style={styles.symbolBadgeText}>{coin.symbol}</Text>
        </View>
        <View style={styles.coinDetails}>
          <Text style={styles.coinName} numberOfLines={1}>{coin.name}</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.priceRow}>
          <SparklineChart
            data={sparklineData}
            color={sparklineColor}
            width={56}
            height={28}
          />
          <View style={styles.priceBlock}>
            <Text style={[styles.change, isPositive ? styles.changePositive : styles.changeNegative]}>
              {formatPercentage(coin.change24h)}
            </Text>
            <Text style={styles.price}>{formatPrice(coin.price)}</Text>
          </View>
        </View>
        {coin.rank > 0 && (
          <Text style={styles.rank}>#{coin.rank}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}, areTrendingCoinCardPropsEqual);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: semantic.listMarginH,
    marginBottom: semantic.listGap,
    backgroundColor: semantic.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...semantic.cardShadow,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  symbolBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  symbolBadgeText: {
    fontSize: typography.fontSizes.badge,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  coinDetails: {
    flex: 1,
  },
  coinName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[800],
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  change: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  changePositive: {
    color: colors.success[500],
  },
  changeNegative: {
    color: colors.danger[500],
  },
  price: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginTop: 2,
  },
  rank: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
});
