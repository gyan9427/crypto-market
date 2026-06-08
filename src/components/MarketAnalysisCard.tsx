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
import { Plus } from 'lucide-react-native';
import type { MarketAnalysisCoin } from '../types';
import type { LivePriceQuote } from '../hooks/useMarketPriceStream';
import { formatPrice, formatPercentage } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SignalTag } from './SignalTag';
import { useHoldingsStatus } from '../hooks/useHoldingsStatus';
import { useAppStore } from '../state/useAppStore';
import { useRiskStore } from '../state/useRiskStore';

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
  const riskCoin = useRiskStore((s) => s.crsBySymbol.get(coin.symbol.toUpperCase()));
  const riskStale = useRiskStore((s) => s.meta.stale);

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
      style={styles.row}
      onPress={() => onPress(coin.coinId)}
      accessibilityRole="button"
      accessibilityLabel={`${coin.name} ${formatPrice(livePrice)}`}
      activeOpacity={0.7}
    >
      {/* ── Row 1: identity + price + signals ── */}
      <View style={styles.topRow}>
        <Text style={styles.rank}>{rank}</Text>

        <View style={styles.coinIconWrap}>
          {showCoinLogo ? (
            <Image
              source={{ uri: coin.image }}
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

        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatPrice(livePrice)}</Text>
          <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
            {isPositive ? '▲' : '▼'} {formatPercentage(liveChange24h).replace(/^[+-]/, '')}
          </Text>
        </View>

        <View style={styles.signalsBlock}>
          {riskCoin && (
            <View style={[styles.crsPill, riskStale && styles.crsPillStale]}>
              <Text style={styles.crsPillText}>
                CRS {(riskCoin.crs * 100).toFixed(0)}
              </Text>
            </View>
          )}
          {visibleSignals.map((s) => (
            <SignalTag key={s.type} signal={s} />
          ))}
        </View>
      </View>

      {/* ── Row 2: why-moving + action ── */}
      <View style={styles.bottomRow}>
        <View style={styles.whyBlock}>
          {coin.whyMoving ? (
            <Text style={styles.whyMoving} numberOfLines={2}>
              <Text style={styles.whyMovingLead}>{t('explore.whyMoving')} </Text>
              {coin.whyMoving}
            </Text>
          ) : (
            <View style={styles.whyMovingPlaceholder} />
          )}
        </View>

        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.addBtn, isFollowing && styles.addBtnFollowing]}
            onPress={onAddPress}
            disabled={followBusy}
            accessibilityRole="button"
            accessibilityLabel={isFollowing ? t('accessibility.unfollowCoin') : t('explore.add')}
          >
            {followBusy ? (
              <ActivityIndicator size="small" color={isFollowing ? c.primary[500] : c.success[500]} />
            ) : (
              <View style={styles.addBtnInner}>
                {!isFollowing && <Plus size={13} color={c.success[500]} strokeWidth={2.5} />}
                <Text style={[styles.addBtnText, isFollowing && styles.addBtnTextFollowing]}>
                  {isFollowing ? t('explore.following') : t('explore.add')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.holdingsHint}>
            {isHeld ? t('explore.youHold') : t('explore.youDontHold')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    row: {
      paddingHorizontal: s.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.bg,
    },
    // ── Row 1 ──
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rank: {
      width: 18,
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textMuted,
      marginRight: s.xs,
      textAlign: 'center',
    },
    coinIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
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
      color: c.primary[600],
    },
    identity: {
      width: 74,
      marginRight: s.sm,
    },
    coinName: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      letterSpacing: -0.2,
    },
    coinSymbol: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
    },
    priceBlock: {
      width: 72,
      marginRight: s.sm,
      alignItems: 'flex-start',
    },
    price: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontVariant: ['tabular-nums'],
    },
    change: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    positive: { color: c.success[500] },
    negative: { color: c.danger[500] },
    signalsBlock: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    crsPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: tokens.isDark ? 'rgba(239,68,68,0.15)' : c.error[100],
    },
    crsPillStale: {
      opacity: 0.55,
    },
    crsPillText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      color: c.danger[600],
      fontVariant: ['tabular-nums'],
    },
    // ── Row 2 ──
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingLeft: 18 + 34 + s.sm,
    },
    whyBlock: {
      flex: 1,
      marginRight: s.sm,
    },
    whyMoving: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      lineHeight: 16,
    },
    whyMovingLead: {
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    whyMovingPlaceholder: {
      height: 32,
    },
    actionBlock: {
      alignItems: 'center',
    },
    addBtn: {
      borderWidth: 1,
      borderColor: c.success[500],
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnFollowing: {
      borderColor: c.primary[400],
      backgroundColor: tokens.isDark ? 'rgba(168,85,247,0.10)' : c.primary[50],
    },
    addBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addBtnText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.success[500],
      letterSpacing: 0.02,
    },
    addBtnTextFollowing: {
      color: c.primary[500],
    },
    holdingsHint: {
      fontSize: 10,
      color: tokens.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
