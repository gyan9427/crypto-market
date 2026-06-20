import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Coin } from '@/src/types';
import type { ThemeTokens } from '@/src/design-system/theme/types';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAppStore } from '@/src/state/useAppStore';
import { getCoinLogoUri } from '@/src/utils/coinLogo';

const DEFAULT_AVATAR_SIZE = 40;
const OVERLAP_RATIO = 0.35;
const MAX_VISIBLE = 1;

type Props = {
  coins: Coin[];
  onPress?: (coinId: string) => void;
  maxVisible?: number;
  size?: number;
  highlightRisk?: boolean;
};

function buildStackStyles(tokens: ThemeTokens, avatarSize: number) {
  const c = tokens.colors;
  const riskBorder = c.error?.[500] ?? c.danger?.[500];

  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    layer: {
      position: 'absolute',
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      borderWidth: 2,
      borderColor: tokens.border,
      overflow: 'hidden',
      backgroundColor: c.neutral[200],
      justifyContent: 'center',
      alignItems: 'center',
      ...tokens.shadows.sm,
    },
    layerRisk: {
      borderColor: riskBorder,
    },
    image: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    initial: {
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.bold,
      fontFamily: tokens.typography.fontFamilies.sansBold,
      color: tokens.textMuted,
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

type CoinAvatarProps = {
  coin: Coin;
  logoUri?: string;
  index: number;
  styles: ReturnType<typeof buildStackStyles>;
  left: number;
  zIndex: number;
  highlightRisk: boolean;
  onPress?: (coinId: string) => void;
};

function CoinAvatarLayer({
  coin,
  logoUri,
  index,
  styles,
  left,
  zIndex,
  highlightRisk,
  onPress,
}: CoinAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showLogo = Boolean(logoUri) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [logoUri]);

  const initial = (coin.symbol?.[0] || coin.name?.[0] || '?').toUpperCase();
  const inner = showLogo ? (
    <Image
      source={{ uri: logoUri }}
      style={styles.image}
      contentFit="cover"
      onError={() => setImageFailed(true)}
      accessibilityLabel={coin.name}
    />
  ) : (
    <Text style={styles.initial}>{initial}</Text>
  );

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      onPress={() => onPress?.(coin.id)}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${coin.name} ${coin.symbol}`}
      style={[
        styles.layer,
        highlightRisk && index === 0 && styles.layerRisk,
        { left, zIndex },
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
}

export function CoinStackAvatars({
  coins,
  onPress,
  maxVisible = MAX_VISIBLE,
  size = DEFAULT_AVATAR_SIZE,
  highlightRisk = false,
}: Props) {
  const { tokens } = useAppTheme();
  const marketSnapshot = useAppStore((s) => s.marketSnapshot);
  const styles = useMemo(() => buildStackStyles(tokens, size), [tokens, size]);
  const overlap = Math.round(size * OVERLAP_RATIO);
  const visible = coins.slice(0, maxVisible);
  const extra = coins.length - visible.length;
  const slotCount = visible.length + (extra > 0 ? 1 : 0);
  const width = slotCount > 0 ? size + (slotCount - 1) * (size - overlap) : 0;

  const logoByCoinId = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const coin of visible) {
      map.set(coin.id, getCoinLogoUri(coin, marketSnapshot));
    }
    return map;
  }, [visible, marketSnapshot]);

  if (visible.length === 0) return null;

  return (
    <View style={[styles.wrap, { width, height: size }]}>
      {visible.map((coin, index) => {
        const left = index * (size - overlap);
        const zIndex = visible.length - index;

        return (
          <CoinAvatarLayer
            key={`${coin.id}-${index}`}
            coin={coin}
            logoUri={logoByCoinId.get(coin.id)}
            index={index}
            styles={styles}
            left={left}
            zIndex={zIndex}
            highlightRisk={highlightRisk}
            onPress={onPress}
          />
        );
      })}
      {extra > 0 && (
        <View
          style={[
            styles.layer,
            styles.moreBadge,
            {
              left: visible.length * (size - overlap),
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
