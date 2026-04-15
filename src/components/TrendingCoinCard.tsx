import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { TrendingCoin } from '../types';
import { formatPrice, formatPercentage } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SparklineChart } from './SparklineChart';

interface TrendingCoinCardProps {
  coin: TrendingCoin;
  onPress?: (coinId: string) => void;
}

function sparklineDataSignature(sp?: number[]): string {
  if (!sp || sp.length < 2) return '';
  return `${sp.length}:${sp[0]}:${sp[sp.length - 1]}`;
}

function areTrendingCoinCardPropsEqual(prev: TrendingCoinCardProps, next: TrendingCoinCardProps): boolean {
  const a = prev.coin;
  const b = next.coin;
  return (
    a.id === b.id &&
    a.symbol === b.symbol &&
    a.price === b.price &&
    a.change24h === b.change24h &&
    a.rank === b.rank &&
    sparklineDataSignature(a.sparklineData) === sparklineDataSignature(b.sparklineData)
  );
}

export const TrendingCoinCard = React.memo<TrendingCoinCardProps>(({ coin, onPress }) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildTrendingCoinCardStyles(tokens), [tokens]);
  const c = tokens.colors;
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const isPositive = coin.change24h >= 0;
  /** Phase 3: snapshot-backed closes only; no per-card /charts/klines. Fallback: flat line from price. */
  const sparklineData = useMemo(() => {
    const s = coin.sparklineData;
    if (s && s.length >= 2) return s;
    const p = coin.price;
    if (Number.isFinite(p)) return [p, p];
    return [];
  }, [coin.sparklineData, coin.price]);
  const sparklineColor = isPositive ? c.success[500] : c.danger[500];
  const showCoinLogo = Boolean(coin.logo) && !imageLoadFailed;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [coin.logo]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(coin.id)}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${formatPrice(coin.price)}`}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <View style={styles.coinIconContainer}>
          {showCoinLogo ? (
            <Image
              source={{ uri: coin.logo }}
              style={styles.coinIcon}
              resizeMode="cover"
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <Text style={styles.coinIconFallbackText}>{coin.symbol}</Text>
          )}
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

function buildTrendingCoinCardStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: sem.listMarginH,
      marginBottom: sem.listGap,
      backgroundColor: sem.surface,
      borderRadius: br.md,
      padding: s.md,
      borderWidth: 1,
      borderColor: c.neutral[100],
      ...sem.cardShadow,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: s.sm,
    },
    coinIconContainer: {
      width: 28,
      height: 28,
      backgroundColor: c.primary[100],
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.neutral[100],
      marginRight: s.sm,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    coinIcon: {
      width: '100%',
      height: '100%',
    },
    coinIconFallbackText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      color: c.primary[700],
    },
    coinDetails: {
      flex: 1,
    },
    coinName: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[800],
    },
    rightSection: {
      alignItems: 'flex-end',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    change: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
    },
    changePositive: {
      color: c.success[500],
    },
    changeNegative: {
      color: c.danger[500],
    },
    price: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[800],
      marginTop: 2,
    },
    rank: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[400],
      marginTop: 2,
    },
  });
}
