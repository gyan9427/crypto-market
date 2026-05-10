import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MarketAnalysisCoin } from '../types';
import type { LivePriceQuote } from '../hooks/useMarketPriceStream';
import { formatPrice, formatPercentage } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SignalTag } from './SignalTag';
import { useHoldingsStatus } from '../hooks/useHoldingsStatus';
import { useAppStore } from '../state/useAppStore';

export interface MarketAnalysisCardProps {
  coin: MarketAnalysisCoin;
  rank: number;
  liveQuote?: LivePriceQuote;
  onPress: (coinId: string) => void;
}

export const MarketAnalysisCard = React.memo(function MarketAnalysisCard({
  coin,
  rank,
  liveQuote,
  onPress,
}: MarketAnalysisCardProps) {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;

  const toggleFollowCoin = useAppStore((s) => s.toggleFollowCoin);
  const followingCoins = useAppStore((s) => s.followingCoins);
  const isFollowing = followingCoins.includes(coin.coinId);

  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const { isHeld } = useHoldingsStatus(coin.symbol);

  const rawLivePrice = liveQuote?.price;
  const livePrice =
    typeof rawLivePrice === 'number' && Number.isFinite(rawLivePrice) ? rawLivePrice : coin.price;
  const livePct = liveQuote?.percentChange24h;
  const liveChange24h =
    typeof livePct === 'number' && Number.isFinite(livePct) ? livePct : coin.percentChange24h;
  const isPositive = liveChange24h >= 0;

  const visibleSignals = coin.signals.slice(0, 2);
  const showCoinLogo = Boolean(coin.image) && !imageLoadFailed;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [coin.image]);

  const onAddPress = useCallback(async () => {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      await toggleFollowCoin(coin.coinId);
    } catch (e) {
      console.warn('toggleFollowCoin', e);
    } finally {
      setFollowBusy(false);
    }
  }, [coin.coinId, followBusy, toggleFollowCoin]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(coin.coinId)}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${formatPrice(livePrice)}`}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <Text style={styles.rank}>{rank}</Text>
        <View style={styles.coinIconContainer}>
          {showCoinLogo ? (
            <Image
              source={{ uri: coin.image }}
              style={styles.coinIcon}
              resizeMode="cover"
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <Text style={styles.coinIconFallbackText}>{coin.symbol}</Text>
          )}
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.coinName} numberOfLines={1}>
            {coin.name}
          </Text>
          <Text style={styles.coinSymbol} numberOfLines={1}>
            {coin.symbol}
          </Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={[styles.change, isPositive ? styles.changePositive : styles.changeNegative]}>
            {formatPercentage(liveChange24h)}
          </Text>
          <Text style={styles.price}>{formatPrice(livePrice)}</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {visibleSignals.map((s) => (
          <SignalTag key={s.type} signal={s} />
        ))}
      </View>

      {coin.whyMoving ? (
        <Text style={styles.whyMoving} numberOfLines={2}>
          <Text style={styles.whyMovingLead}>{t('explore.whyMoving')} </Text>
          {coin.whyMoving}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.holdingsHint}>
          {isHeld ? t('explore.youHold') : t('explore.youDontHold')}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, isFollowing && styles.addBtnActive]}
          onPress={onAddPress}
          disabled={followBusy}
          accessibilityRole="button"
          accessibilityLabel={isFollowing ? t('accessibility.unfollowCoin') : t('explore.add')}
        >
          {followBusy ? (
            <ActivityIndicator size="small" color={c.primary[600]} />
          ) : (
            <Text style={[styles.addBtnText, isFollowing && styles.addBtnTextActive]}>
              {isFollowing ? t('explore.following') : t('explore.add')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    container: {
      marginHorizontal: sem.listMarginH,
      marginBottom: sem.listGap,
      backgroundColor: sem.surface,
      borderRadius: br.md,
      padding: s.md,
      borderWidth: 1,
      borderColor: c.neutral[100],
      ...sem.cardShadow,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rank: {
      width: 22,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.bold,
      color: tokens.textMuted,
      marginRight: s.xs,
    },
    coinIconContainer: {
      width: 36,
      height: 36,
      backgroundColor: c.primary[100],
      borderRadius: 18,
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
    titleBlock: {
      flex: 1,
      minWidth: 0,
      marginRight: s.sm,
    },
    coinName: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    coinSymbol: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      marginTop: 2,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    change: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
    },
    changePositive: { color: c.success[500] },
    changeNegative: { color: c.danger[500] },
    price: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      marginTop: 2,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: s.xs,
      marginTop: s.sm,
    },
    whyMoving: {
      marginTop: s.sm,
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      lineHeight: 18,
    },
    whyMovingLead: {
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    footerRow: {
      marginTop: s.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    holdingsHint: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      flex: 1,
      marginRight: s.sm,
    },
    addBtn: {
      paddingHorizontal: s.md,
      paddingVertical: 8,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.success[500],
      minWidth: 88,
      alignItems: 'center',
    },
    addBtnActive: {
      borderColor: c.primary[400],
      backgroundColor: c.primary[50],
    },
    addBtnText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.success[600],
    },
    addBtnTextActive: {
      color: c.primary[700],
    },
  });
}
