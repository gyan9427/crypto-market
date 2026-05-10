import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { TrendingCoin } from '../types';
import { formatPrice, formatPercentage } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SparklineChart } from './SparklineChart';
import type { LivePriceQuote } from '../hooks/useMarketPriceStream';

interface TrendingCoinCardProps {
  coin: TrendingCoin;
  liveQuote?: LivePriceQuote;
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
    sparklineDataSignature(a.sparklineData) === sparklineDataSignature(b.sparklineData) &&
    prev.liveQuote?.price === next.liveQuote?.price &&
    prev.liveQuote?.percentChange24h === next.liveQuote?.percentChange24h
  );
}

export const TrendingCoinCard = React.memo<TrendingCoinCardProps>(({ coin, liveQuote, onPress }) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildTrendingCoinCardStyles(tokens), [tokens]);
  const c = tokens.colors;
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const rawLivePrice = liveQuote?.price;
  const livePrice = typeof rawLivePrice === 'number' && Number.isFinite(rawLivePrice)
    ? rawLivePrice
    : coin.price;
  const livePercentChange24h = liveQuote?.percentChange24h;
  const liveChange24h = typeof livePercentChange24h === 'number' && Number.isFinite(livePercentChange24h)
    ? livePercentChange24h
    : coin.change24h;
  const isPositive = liveChange24h >= 0;
  const sparklineData = useMemo(() => {
    const s = coin.sparklineData;
    if (s && s.length >= 2) return s;
    const p = livePrice;
    if (Number.isFinite(p)) return [p, p];
    return [];
  }, [coin.sparklineData, livePrice]);
  const sparklineColor = isPositive ? c.success[500] : c.danger[500];
  const showCoinLogo = Boolean(coin.logo) && !imageLoadFailed;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [coin.logo]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(coin.id)}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${formatPrice(livePrice)}`}
      activeOpacity={0.7}
    >
      {/* Left: rank + icon + name/symbol */}
      {coin.rank > 0 && (
        <Text style={styles.rank}>{coin.rank}</Text>
      )}

      <View style={styles.coinIconWrap}>
        {showCoinLogo ? (
          <Image
            source={{ uri: coin.logo }}
            style={styles.coinIcon}
            resizeMode="cover"
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <Text style={styles.coinIconFallback}>{coin.symbol.slice(0, 3)}</Text>
        )}
      </View>

      <View style={styles.identity}>
        <Text style={styles.coinName} numberOfLines={1}>{coin.name}</Text>
        <Text style={styles.coinSymbol} numberOfLines={1}>{coin.symbol}</Text>
      </View>

      {/* Middle: sparkline */}
      <View style={styles.sparklineWrap}>
        <SparklineChart
          data={sparklineData}
          color={sparklineColor}
          width={60}
          height={28}
        />
      </View>

      {/* Right: price + change */}
      <View style={styles.priceBlock}>
        <Text style={styles.price}>{formatPrice(livePrice)}</Text>
        <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
          {isPositive ? '▲' : '▼'} {formatPercentage(liveChange24h).replace(/^[+-]/, '')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}, areTrendingCoinCardPropsEqual);

TrendingCoinCard.displayName = 'TrendingCoinCard';

function buildTrendingCoinCardStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.borderSubtle,
      backgroundColor: tokens.surface,
      minHeight: 48,
    },
    rank: {
      width: 20,
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.textMuted,
      marginRight: s.xs,
      textAlign: 'center',
      letterSpacing: typo.letterSpacing.caption,
      fontVariant: ['tabular-nums'],
    },
    coinIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.isDark ? 'rgba(168,85,247,0.12)' : c.primary[100],
      borderWidth: 1,
      borderColor: tokens.border,
      marginRight: s.sm,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    coinIcon: {
      width: '100%',
      height: '100%',
    },
    coinIconFallback: {
      fontSize: 9,
      fontWeight: typo.fontWeights.bold,
      fontFamily: typo.fontFamilies.sansBold,
      color: c.primary[600],
    },
    identity: {
      flex: 1,
      marginRight: s.sm,
      minWidth: 0,
    },
    coinName: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.text,
      letterSpacing: typo.letterSpacing.caption,
    },
    coinSymbol: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      textTransform: 'uppercase',
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
    sparklineWrap: {
      marginRight: s.md,
    },
    priceBlock: {
      alignItems: 'flex-end',
      minWidth: 76,
    },
    change: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      marginTop: 3,
      fontVariant: ['tabular-nums'],
      letterSpacing: typo.letterSpacing.caption,
    },
    positive: { color: c.success[500] },
    negative: { color: c.danger[500] },
    price: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: typo.letterSpacing.caption,
    },
  });
}
