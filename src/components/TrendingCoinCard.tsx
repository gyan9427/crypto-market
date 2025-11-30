import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingCoin } from '../types';
import { Sparkline } from './Sparkline';
import { formatPrice, formatPercentage } from '../utils/format';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';

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
      <View style={styles.header}>
        <View style={styles.coinInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{coin.symbol[0]}</Text>
          </View>
          <View>
            <Text style={styles.symbol}>{coin.symbol}</Text>
            <Text style={styles.name} numberOfLines={1}>{coin.name}</Text>
          </View>
        </View>
        <Text style={styles.rank}>#{coin.rank}</Text>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(coin.price)}</Text>
        <Text style={[styles.change, isPositive ? styles.changePositive : styles.changeNegative]}>
          {formatPercentage(coin.change24h)}
        </Text>
      </View>

      {coin.sparklineData && (
        <View style={styles.sparklineContainer}>
          <Sparkline data={coin.sparklineData} width={100} height={30} isPositive={isPositive} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  name: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 2,
  },
  rank: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[400],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginRight: spacing.sm,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
  changePositive: {
    color: colors.success[500],
  },
  changeNegative: {
    color: colors.danger[500],
  },
  sparklineContainer: {
    alignItems: 'flex-start',
  },
});
