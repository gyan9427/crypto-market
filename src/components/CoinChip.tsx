import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Coin } from '../types';
import { colors, shadows, borderRadius } from '../theme/theme';

interface CoinChipProps {
  coin: Coin;
  onPress?: (coinId: string) => void;
}

export const CoinChip: React.FC<CoinChipProps> = ({ coin, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(coin.id)}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${coin.symbol}`}
      activeOpacity={0.7}
    >
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{coin.symbol[0]}</Text>
      </View>
      <Text style={styles.symbol} numberOfLines={1}>{coin.symbol}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.button,
    marginRight: 8,
    ...shadows.sm,
    minHeight: 44,
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  symbol: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
});
