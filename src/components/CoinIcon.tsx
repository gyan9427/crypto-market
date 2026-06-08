import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Coin } from '@/src/types';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAppStore } from '@/src/state/useAppStore';
import { getCoinLogoUri } from '@/src/utils/coinLogo';

type Props = {
  coin: Coin;
  size?: number;
  onPress?: (coinId: string) => void;
  highlightRisk?: boolean;
  style?: StyleProp<ViewStyle>;
};

function buildStyles(tokens: ThemeTokens, size: number, highlightRisk: boolean) {
  const c = tokens.colors;
  const riskBorder = c.error?.[500] ?? c.danger?.[500] ?? '#ef4444';

  return StyleSheet.create({
    wrap: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: tokens.isDark ? 'rgba(168,85,247,0.12)' : c.primary[100],
      borderWidth: 1,
      borderColor: highlightRisk ? riskBorder : tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallback: {
      fontSize: Math.max(8, Math.round(size * 0.25)),
      fontWeight: tokens.typography.fontWeights.bold,
      fontFamily: tokens.typography.fontFamilies.sansBold,
      color: c.primary[600],
      textTransform: 'uppercase',
    },
  });
}

/** Circular coin logo — same display rules as Market (`TrendingCoinCard`). */
export function CoinIcon({
  coin,
  size = 36,
  onPress,
  highlightRisk = false,
  style,
}: Props) {
  const { tokens } = useAppTheme();
  const marketSnapshot = useAppStore((s) => s.marketSnapshot);
  const styles = useMemo(
    () => buildStyles(tokens, size, highlightRisk),
    [tokens, size, highlightRisk]
  );
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const logoUri = useMemo(
    () => getCoinLogoUri(coin, marketSnapshot),
    [coin.id, coin.symbol, coin.logo, marketSnapshot]
  );

  const showCoinLogo = Boolean(logoUri) && !imageLoadFailed;
  const fallbackLabel = (coin.symbol || coin.name || '?').slice(0, 3);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [logoUri]);

  const inner = (
    <View style={[styles.wrap, style]}>
      {showCoinLogo ? (
        <Image
          source={{ uri: logoUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageLoadFailed(true)}
          accessibilityLabel={coin.name}
        />
      ) : (
        <Text style={styles.fallback}>{fallbackLabel}</Text>
      )}
    </View>
  );

  if (!onPress) return inner;

  return (
    <TouchableOpacity
      onPress={() => onPress(coin.id)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${coin.symbol}`}
    >
      {inner}
    </TouchableOpacity>
  );
}
