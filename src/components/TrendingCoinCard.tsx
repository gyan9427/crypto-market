import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingCoin } from '../types';
import { formatPrice, formatPercentage } from '../utils/format';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
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
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  symbolBadge: {
    backgroundColor: colors.surface.tintedPrimary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  symbolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
    fontFamily: 'JetBrainsMono_500Medium',
  },
  coinDetails: {
    flex: 1,
  },
  coinName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    fontFamily: 'Manrope_600SemiBold',
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'JetBrainsMono_500Medium',
  },
  changePositive: {
    color: colors.success[500],
  },
  changeNegative: {
    color: colors.danger[500],
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginTop: 2,
    fontFamily: 'Manrope_600SemiBold',
  },
  rank: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
