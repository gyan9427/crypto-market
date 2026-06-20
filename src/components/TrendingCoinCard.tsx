import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingCoin } from '../types';
import { CoinIcon } from './CoinIcon';
import { formatPrice, formatPercentage } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Sparkline } from './Sparkline';
import type { LivePriceQuote } from '../hooks/useMarketPriceStream';
import { useExploreRenderAttribution } from '../utils/exploreRenderAttribution';

const FLAT_SPARKLINE: number[] = [0, 0];

interface TrendingCoinCardProps {
  coin: TrendingCoin;
  liveQuote?: LivePriceQuote;
  onPress?: (coinId: string) => void;
  /** Explore rows: 5h baseline from sparklineHistoryHub (not coin.sparklineData). */
  sparklineData?: number[];
  sparklineRevision?: number;
}

function sparklinePropsSignature(sp?: number[], revision?: number): string {
  if (!sp || sp.length < 2) return '';
  return `${revision ?? 0}:${sp.length}:${sp[0]}:${sp[sp.length - 1]}`;
}

function areTrendingCoinCardPropsEqual(prev: TrendingCoinCardProps, next: TrendingCoinCardProps): boolean {
  const a = prev.coin;
  const b = next.coin;
  const prevSpark = prev.sparklineData ?? a.sparklineData;
  const nextSpark = next.sparklineData ?? b.sparklineData;
  return (
    a.id === b.id &&
    a.symbol === b.symbol &&
    a.price === b.price &&
    a.change24h === b.change24h &&
    a.rank === b.rank &&
    sparklinePropsSignature(prevSpark, prev.sparklineRevision) ===
      sparklinePropsSignature(nextSpark, next.sparklineRevision) &&
    prev.liveQuote?.price === next.liveQuote?.price &&
    prev.liveQuote?.percentChange24h === next.liveQuote?.percentChange24h
  );
}

export const TrendingCoinCard = React.memo<TrendingCoinCardProps>(({
  coin,
  liveQuote,
  onPress,
  sparklineData: sparklineOverride,
  sparklineRevision,
}) => {
  const cardProps = useMemo(
    () => ({ coin, liveQuote, onPress, sparklineData: sparklineOverride, sparklineRevision }),
    [coin, liveQuote, onPress, sparklineOverride, sparklineRevision]
  );
  useExploreRenderAttribution('TrendingCoinCard', cardProps, {
    coinId: coin.id,
    memoCompare: areTrendingCoinCardPropsEqual,
  });

  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildTrendingCoinCardStyles(tokens), [tokens]);
  const c = tokens.colors;

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
    const s = sparklineOverride ?? coin.sparklineData;
    if (s && s.length >= 2) return s;
    return FLAT_SPARKLINE;
  }, [sparklineOverride, coin.sparklineData]);
  const sparklineColor = isPositive ? c.success[500] : c.danger[500];

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

      <CoinIcon coin={coin} size={36} style={styles.coinIconMargin} />

      <View style={styles.identity}>
        <Text style={styles.coinName} numberOfLines={1}>{coin.name}</Text>
        <Text style={styles.coinSymbol} numberOfLines={1}>{coin.symbol}</Text>
      </View>

      {/* Middle: sparkline */}
      <View style={styles.sparklineWrap}>
        <Sparkline
          data={sparklineData}
          revision={sparklineRevision}
          lineColor={sparklineColor}
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
      paddingVertical: 0,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.borderSubtle,
      backgroundColor: tokens.bg,
      minHeight: 56,
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
    coinIconMargin: {
      marginRight: s.sm,
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
