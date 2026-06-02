import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Coin } from '@/src/types';
import type { ThemeTokens } from '@/src/design-system/theme/types';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const AVATAR_SIZE = 40;
const OVERLAP = 14;
const MAX_VISIBLE = 4;

type Props = {
  coins: Coin[];
  onPress?: (coinId: string) => void;
  maxVisible?: number;
};

function buildStackStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    layer: {
      position: 'absolute',
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: tokens.surface,
      overflow: 'hidden',
      backgroundColor: c.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    initial: {
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.bold,
      fontFamily: tokens.typography.fontFamilies.sansBold,
      color: c.white,
    },
    moreBadge: {
      backgroundColor: tokens.isDark ? c.neutral[300] : c.neutral[200],
    },
    moreText: {
      fontSize: tokens.typography.fontSizes.xs,
      fontWeight: tokens.typography.fontWeights.semibold,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
      color: tokens.text,
    },
  });
}

export function CoinStackAvatars({
  coins,
  onPress,
  maxVisible = MAX_VISIBLE,
}: Props) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStackStyles(tokens), [tokens]);
  const visible = coins.slice(0, maxVisible);
  const extra = coins.length - visible.length;
  const slotCount = visible.length + (extra > 0 ? 1 : 0);
  const width =
    slotCount > 0 ? AVATAR_SIZE + (slotCount - 1) * (AVATAR_SIZE - OVERLAP) : 0;

  if (visible.length === 0) return null;

  return (
    <View style={[styles.wrap, { width, height: AVATAR_SIZE }]}>
      {visible.map((coin, index) => {
        const left = index * (AVATAR_SIZE - OVERLAP);
        const zIndex = visible.length - index;
        const initial = (coin.symbol?.[0] || coin.name?.[0] || '?').toUpperCase();
        const inner = coin.logo ? (
          <Image
            source={{ uri: coin.logo }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.initial}>{initial}</Text>
        );

        return (
          <TouchableOpacity
            key={`${coin.id}-${index}`}
            activeOpacity={onPress ? 0.75 : 1}
            disabled={!onPress}
            onPress={() => onPress?.(coin.id)}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={`${coin.name} ${coin.symbol}`}
            style={[styles.layer, { left, zIndex }]}
          >
            {inner}
          </TouchableOpacity>
        );
      })}
      {extra > 0 && (
        <View
          style={[
            styles.layer,
            styles.moreBadge,
            {
              left: visible.length * (AVATAR_SIZE - OVERLAP),
              zIndex: 0,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.moreText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}
