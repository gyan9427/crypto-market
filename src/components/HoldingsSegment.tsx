import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { Skeleton } from './Skeleton';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { isExchangeHolding } from '@/src/utils/portfolioSource';
import {
  filterHoldingsByAccount,
  type PortfolioAccountSelection,
} from '@/src/utils/portfolioAccountFilter';

const MARKET_ACCENT = '#6383ff';

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

interface HoldingsSegmentProps {
  selectedAccount: PortfolioAccountSelection;
  onHoldingPress?: (holding: { symbol: string; chain: string }) => void;
}

export const HoldingsSegment: React.FC<HoldingsSegmentProps> = ({
  selectedAccount,
  onHoldingPress,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildHoldingsSegmentStyles(tokens), [tokens]);

  const wallets = usePortfolioStore((state) => state.wallets);
  const exchanges = usePortfolioStore((state) => state.exchanges);
  const exchangePortfolioEnabled = usePortfolioStore((state) => state.exchangePortfolioEnabled);
  const holdings = usePortfolioStore((state) => state.holdings);
  const holdingsLoading = usePortfolioStore((state) => state.holdingsLoading);

  const hasExchangeLinked = exchangePortfolioEnabled && exchanges.length > 0;
  const hasAnyPortfolioSource = wallets.length > 0 || hasExchangeLinked;

  const filteredView = useMemo(() => {
    if (!holdings) return null;
    return filterHoldingsByAccount(holdings, selectedAccount);
  }, [holdings, selectedAccount]);

  if (!hasAnyPortfolioSource) {
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('portfolio.holdings')}</Text>
        <View style={styles.flatRow}>
          <Text style={styles.emptyText}>
            {exchangePortfolioEnabled ? t('portfolio.addSourceHint') : t('portfolio.addWalletHint')}
          </Text>
        </View>
      </View>
    );
  }

  if (holdingsLoading && !holdings) {
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('portfolio.holdings')}</Text>
        <View style={styles.flatRow}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="30%" height={14} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.flatRow}>
          <Skeleton width="60%" height={16} />
        </View>
        <View style={styles.flatRow}>
          <Skeleton width="55%" height={16} />
        </View>
      </View>
    );
  }

  if (!holdings || !filteredView) {
    return null;
  }

  const {
    positions: filteredPositions,
    displayTotal,
    showCombined24h,
    relativeChange24h,
    emptyFiltered,
  } = filteredView;

  const changePositive = relativeChange24h >= 0;
  const visiblePositions = filteredPositions.slice(0, 10);

  const emptyMessage =
    selectedAccount.kind === 'all_exchanges' || selectedAccount.kind === 'exchange'
      ? t('portfolio.emptyExchangePositions')
      : t('portfolio.emptyWalletPositions');

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('portfolio.holdings')}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <Text style={styles.totalValue}>{formatUsd(displayTotal)}</Text>
        </View>
        <View style={styles.summaryRight}>
          {showCombined24h ? (
            <>
              <Text
                style={[
                  styles.change24h,
                  changePositive ? styles.changePositive : styles.changeNegative,
                ]}
              >
                {changePositive ? '▲' : '▼'} {Math.abs(relativeChange24h).toFixed(2)}%
              </Text>
              <Text style={styles.changeLabel}>24h</Text>
            </>
          ) : (
            <Text style={styles.change24hMuted}>{t('portfolio.singleScope24hUnavailable')}</Text>
          )}
        </View>
      </View>

      {emptyFiltered ? (
        <View style={styles.flatRow}>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyPositionsText}>{emptyMessage}</Text>
            {selectedAccount.kind === 'exchange' || selectedAccount.kind === 'all_exchanges' ? (
              <Text style={styles.emptyPositionsSub}>
                {hasExchangeLinked
                  ? t('portfolio.exchangeBalancesPending')
                  : t('portfolio.connectExchangeHint')}
              </Text>
            ) : null}
          </View>
        </View>
      ) : visiblePositions.length > 0 ? (
        visiblePositions.map((p, i) => (
          <TouchableOpacity
            key={`${p.symbol ?? 'sym'}-${p.chain ?? 'ch'}-${p.source ?? 'wallet'}-${p.sourceConnectionId ?? ''}-${i}`}
            style={styles.positionRow}
            onPress={() => onHoldingPress?.({ symbol: p.symbol, chain: p.chain })}
            activeOpacity={0.7}
          >
            {isExchangeHolding(p) ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {venueDisplayLabel(p.venue) || t('portfolio.sourceExchange')}
                </Text>
              </View>
            ) : (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {mapAssetDisplay(p.chain ?? '').toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.identity}>
              <Text style={styles.positionSymbol} numberOfLines={1}>
                {mapAssetDisplay(p.symbol)}
              </Text>
              <Text style={styles.positionQuantity} numberOfLines={1}>
                {formatQuantity(p.quantity)}
              </Text>
            </View>
            <Text style={styles.positionValue}>{formatUsd(p.value)}</Text>
          </TouchableOpacity>
        ))
      ) : null}
    </View>
  );
};

function buildHoldingsSegmentStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';
  const rowBg = tokens.isDark ? '#0a0a0f' : tokens.surface;
  const rowBorder = tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle;

  return StyleSheet.create({
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.textMuted,
      letterSpacing: 0.2,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    summaryLeft: {
      flex: 1,
      minWidth: 0,
    },
    summaryRight: {
      alignItems: 'flex-end',
      minWidth: 76,
    },
    totalValue: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.text,
      fontVariant: ['tabular-nums'],
    },
    change24h: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      fontVariant: ['tabular-nums'],
    },
    changeLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 3,
    },
    change24hMuted: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      fontStyle: 'italic',
      textAlign: 'right',
      maxWidth: 120,
    },
    changePositive: {
      color: c.success[500],
    },
    changeNegative: {
      color: c.danger[500],
    },
    flatRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    emptyContent: {
      flex: 1,
    },
    emptyPositionsText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
    },
    emptyPositionsSub: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 4,
    },
    positionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    badge: {
      backgroundColor: accentBg,
      borderRadius: 8,
      paddingHorizontal: s.sm,
      paddingVertical: 4,
      marginRight: s.sm,
      maxWidth: 72,
      alignItems: 'center',
    },
    badgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      color: MARKET_ACCENT,
    },
    identity: {
      flex: 1,
      marginRight: s.sm,
      minWidth: 0,
    },
    positionSymbol: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    positionQuantity: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
    },
    positionValue: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontVariant: ['tabular-nums'],
      minWidth: 76,
      textAlign: 'right',
    },
  });
}
