import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingCoin } from '../types';
import { formatPrice, formatPercentage } from '../utils/format';
import { colors, spacing, semantic, typography } from '../theme/theme';

interface TrendingCoinCardProps {
  coin: TrendingCoin;
  onPress?: (coinId: string) => void;
}

export const TrendingCoinCard: React.FC<TrendingCoinCardProps> = ({ coin, onPress }) => {
  const isPositive = coin.change24h >= 0;

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
        <Text style={[styles.change, isPositive ? styles.changePositive : styles.changeNegative]}>
          {formatPercentage(coin.change24h)}
        </Text>
        <Text style={styles.price}>{formatPrice(coin.price)}</Text>
        {coin.rank > 0 && (
          <Text style={styles.rank}>#{coin.rank}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: semantic.listMarginH,
    marginBottom: semantic.listGap,
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadiusSmall,
    padding: semantic.cardPadding,
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
    borderRadius: semantic.cardRadiusSmall,
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
