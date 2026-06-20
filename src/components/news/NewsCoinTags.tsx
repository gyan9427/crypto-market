import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Coin } from '@/src/types';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type Props = {
  coins: Coin[];
  onCoinPress?: (coinId: string) => void;
  style?: object;
};

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const typo = tokens.typography;
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: tokens.spacing.xs,
    },
    pill: {
      backgroundColor: c.primary[600],
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: tokens.borderRadius.pill,
      minHeight: 22,
      justifyContent: 'center',
    },
    pillPressed: {
      opacity: 0.88,
    },
    label: {
      fontFamily: typo.fontFamilies.sansSemiBold,
      fontSize: 10,
      fontWeight: typo.fontWeights.semibold,
      color: c.white,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
  });
}

/** Compact purple coin tags (symbol only, no icons) for news cards. */
export function NewsCoinTags({ coins, onCoinPress, style }: Props) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);

  if (coins.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {coins.map((coin) => {
        const label = (
          <Text style={styles.label} numberOfLines={1}>
            {coin.symbol}
          </Text>
        );

        if (!onCoinPress) {
          return (
            <View key={coin.id} style={styles.pill}>
              {label}
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={coin.id}
            style={styles.pill}
            onPress={() => onCoinPress(coin.id)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={coin.name}
          >
            {label}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
