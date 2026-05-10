import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { Skeleton } from './Skeleton';
import { SegmentToggle } from './SegmentToggle';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { isExchangeHolding } from '@/src/utils/portfolioSource';

/** Map MATIC to POL for display (Polygon rebrand) */
function mapAssetDisplay(text: string | undefined | null): string {
  if (text == null || typeof text !== 'string') return '';
  return text.replace(/\bMATIC\b/gi, 'POL');
}

function formatUsd(value: number | undefined | null): string {
  if (value == null || typeof value !== 'number' || !Number.isFinite(value)) return '$0.00';
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(n: number | undefined | null): string {
  if (n == null || typeof n !== 'number' || !Number.isFinite(n)) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

function venueDisplayLabel(venue: string | undefined): string {
  const v = (venue ?? '').toLowerCase();
  if (v === 'coindcx') return 'CoinDCX';
  return venue ? venue.toUpperCase() : '';
}

type HoldingsSourceFilter = 'all' | 'wallet' | 'exchange';

interface HoldingsSegmentProps {
  onHoldingPress?: (holding: { symbol: string; chain: string }) => void;
}

export const HoldingsSegment: React.FC<HoldingsSegmentProps> = ({ onHoldingPress }) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildHoldingsSegmentStyles(tokens), [tokens]);

  const wallets = usePortfolioStore((state) => state.wallets);
  const exchanges = usePortfolioStore((state) => state.exchanges);
  const exchangePortfolioEnabled = usePortfolioStore((state) => state.exchangePortfolioEnabled);
  const holdings = usePortfolioStore((state) => state.holdings);
  const holdingsLoading = usePortfolioStore((state) => state.holdingsLoading);

  const hasExchangeLinked =
    exchangePortfolioEnabled && exchanges.length > 0;

  const hasAnyPortfolioSource =
    wallets.length > 0 || hasExchangeLinked;

  const [sourceFilter, setSourceFilter] = useState<HoldingsSourceFilter>('all');

  useEffect(() => {
    if (sourceFilter === 'exchange' && !hasExchangeLinked) {
      setSourceFilter('all');
    }
  }, [hasExchangeLinked, sourceFilter]);

  const positions = holdings?.positions ?? [];

  const { filteredPositions, walletTotal, exchangeTotal } = useMemo(() => {
    const walletPositions = positions.filter((p) => !isExchangeHolding(p));
    const exchangePositions = positions.filter((p) => isExchangeHolding(p));

    const wSum = walletPositions.reduce((sum, p) => sum + (p.value ?? 0), 0);
    const exSum = exchangePositions.reduce((sum, p) => sum + (p.value ?? 0), 0);

    let filtered = positions;
    if (sourceFilter === 'wallet') filtered = walletPositions;
    if (sourceFilter === 'exchange') filtered = exchangePositions;

    return {
      filteredPositions: filtered,
      walletTotal: wSum,
      exchangeTotal: exSum,
    };
  }, [positions, sourceFilter]);

  if (!hasAnyPortfolioSource) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('portfolio.holdings')}</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {exchangePortfolioEnabled ? t('portfolio.addSourceHint') : t('portfolio.addWalletHint')}
          </Text>
        </View>
      </View>
    );
  }

  if (holdingsLoading && !holdings) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('portfolio.holdings')}</Text>
        <View style={styles.summaryCard}>
          <Skeleton width="60%" height={24} style={styles.skeletonTitle} />
          <Skeleton width="40%" height={16} style={styles.skeletonSub} />
        </View>
        <View style={styles.positionsContainer}>
          <Skeleton width="100%" height={18} />
          <Skeleton width="80%" height={18} style={{ marginTop: 8 }} />
          <Skeleton width="90%" height={18} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  if (!holdings) {
    return null;
  }

  const { totalValue, relativeChange24h } = holdings;

  const displayTotal =
    sourceFilter === 'all'
      ? totalValue
      : sourceFilter === 'wallet'
        ? walletTotal
        : exchangeTotal;

  const changePositive = relativeChange24h >= 0;
  const showCombined24h = sourceFilter === 'all';

  const sourceTabOptions = hasExchangeLinked
    ? [t('portfolio.sourceAll'), t('portfolio.sourceWallet'), t('portfolio.sourceExchange')]
    : [t('portfolio.sourceAll'), t('portfolio.sourceWallet')];

  const sourceTabIndex =
    sourceFilter === 'all' ? 0 : sourceFilter === 'wallet' ? 1 : hasExchangeLinked ? 2 : 1;

  const onSourceTabSelect = (index: number) => {
    if (hasExchangeLinked) {
      setSourceFilter(index === 0 ? 'all' : index === 1 ? 'wallet' : 'exchange');
    } else {
      setSourceFilter(index === 0 ? 'all' : 'wallet');
    }
  };

  const visiblePositions = filteredPositions.slice(0, 10);

  const emptyFiltered =
    filteredPositions.length === 0 &&
    positions.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('portfolio.holdings')}</Text>

      <View style={styles.sourceFilterRow}>
        <SegmentToggle
          options={sourceTabOptions}
          selectedIndex={Math.min(sourceTabIndex, sourceTabOptions.length - 1)}
          onSelect={onSourceTabSelect}
          flush
        />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.totalValue}>{formatUsd(displayTotal)}</Text>
        </View>
        {showCombined24h ? (
          <Text
            style={[
              styles.change24h,
              changePositive ? styles.changePositive : styles.changeNegative,
            ]}
          >
            {changePositive ? '+' : ''}
            {relativeChange24h.toFixed(2)}% (24h)
          </Text>
        ) : (
          <Text style={styles.change24hMuted}>{t('activity.change24hUnavailable')}</Text>
        )}
        {!showCombined24h && sourceFilter === 'wallet' ? (
          <Text style={styles.subtotalHint}>{t('portfolio.walletTotal')}</Text>
        ) : null}
        {!showCombined24h && sourceFilter === 'exchange' ? (
          <Text style={styles.subtotalHint}>{t('portfolio.exchangeTotal')}</Text>
        ) : null}
      </View>

      {emptyFiltered ? (
        <View style={styles.positionsContainer}>
          <Text style={styles.emptyPositionsText}>
            {sourceFilter === 'exchange'
              ? t('portfolio.emptyExchangePositions')
              : t('portfolio.emptyWalletPositions')}
          </Text>
          {sourceFilter === 'exchange' ? (
            <Text style={styles.emptyPositionsSub}>
              {hasExchangeLinked
                ? t('portfolio.exchangeBalancesPending')
                : t('portfolio.connectExchangeHint')}
            </Text>
          ) : null}
        </View>
      ) : visiblePositions.length > 0 ? (
        <View style={styles.positionsContainer}>
          {visiblePositions.map((p, i) => (
            <TouchableOpacity
              key={`${p.symbol ?? 'sym'}-${p.chain ?? 'ch'}-${p.source ?? 'wallet'}-${p.sourceConnectionId ?? ''}-${i}`}
              style={[
                styles.positionRow,
                i < visiblePositions.length - 1 && styles.positionRowBorder,
              ]}
              onPress={() => onHoldingPress?.({ symbol: p.symbol, chain: p.chain })}
              activeOpacity={0.7}
            >
              <View style={styles.positionLeft}>
                {isExchangeHolding(p) ? (
                  <View style={styles.venueBadge}>
                    <Text style={styles.venueBadgeText} numberOfLines={1}>
                      {venueDisplayLabel(p.venue) || t('portfolio.sourceExchange')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chainBadge}>
                    <Text style={styles.chainBadgeText}>
                      {mapAssetDisplay(p.chain ?? '').toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.positionSymbol}>
                    {mapAssetDisplay(p.symbol)}
                  </Text>
                  <Text style={styles.positionQuantity}>
                    {formatQuantity(p.quantity)}
                  </Text>
                </View>
              </View>
              <Text style={styles.positionValue}>{formatUsd(p.value)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

function buildHoldingsSegmentStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      marginHorizontal: sem.listMarginH,
      marginBottom: sem.listGap,
    },
    sectionTitle: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[800],
      marginBottom: s.sm,
    },
    sourceFilterRow: {
      marginBottom: s.sm,
    },
    emptyCard: {
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadiusSmall,
      padding: sem.cardPadding,
      ...sem.cardShadow,
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    summaryCard: {
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadiusSmall,
      padding: sem.cardPadding,
      marginBottom: s.sm,
      ...sem.cardShadow,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalValue: {
      fontSize: typo.fontSizes.xxl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
    },
    change24h: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      marginTop: s.xs,
    },
    change24hMuted: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      marginTop: s.xs,
      fontStyle: 'italic',
    },
    subtotalHint: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
      marginTop: 2,
    },
    changePositive: {
      color: c.success[500],
    },
    changeNegative: {
      color: c.error[500],
    },
    skeletonTitle: {
      marginBottom: s.xs,
    },
    skeletonSub: {},
    positionsContainer: {
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadiusSmall,
      padding: sem.cardPadding,
      marginTop: s.xs,
      marginBottom: s.sm,
      ...sem.cardShadow,
    },
    emptyPositionsText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
      textAlign: 'center',
    },
    emptyPositionsSub: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[400],
      textAlign: 'center',
      marginTop: s.xs,
    },
    positionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: s.sm,
    },
    positionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.neutral[100],
    },
    positionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    chainBadge: {
      backgroundColor: c.primary[100],
      borderRadius: sem.cardRadiusSmall,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      marginRight: s.sm,
    },
    chainBadgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      color: c.primary[700],
    },
    venueBadge: {
      backgroundColor: c.accent[100],
      borderRadius: sem.cardRadiusSmall,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      marginRight: s.sm,
      maxWidth: 96,
    },
    venueBadgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      color: c.accent[800],
    },
    positionSymbol: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[800],
    },
    positionQuantity: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      marginTop: 2,
    },
    positionValue: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[800],
    },
  });
}
