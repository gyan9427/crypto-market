import React, { useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Coin } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface CoinChipProps {
  coin: Coin;
  onPress?: (coinId: string) => void;
}

export const CoinChip: React.FC<CoinChipProps> = ({ coin, onPress }) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildCoinChipStyles(tokens), [tokens]);

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

function buildCoinChipStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.neutral[100],
      borderRadius: br.button,
      marginRight: 8,
      ...tokens.shadows.sm,
      minHeight: 44,
    },
    avatarPlaceholder: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    avatarText: {
      fontSize: 10,
      fontWeight: '600',
      color: c.white,
    },
    symbol: {
      fontSize: 13,
      fontWeight: '600',
      color: c.neutral[800],
    },
  });
}
