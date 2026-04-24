import React, { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { WalletEvent } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

function eventTypeLabel(t: TFunction, type: string): string {
  const keys: Record<string, string> = {
    token_transfer: 'activity.eventTypeTokenTransfer',
    native_transfer: 'activity.eventTypeNativeTransfer',
    contract_interaction: 'activity.eventTypeContractInteraction',
    multi_chain_activity: 'activity.eventTypeMultiChain',
  };
  const k = keys[type];
  return k ? t(k) : type;
}

function txStatusLabel(t: TFunction, status: string): string {
  const keys: Record<string, string> = {
    success: 'activity.statusSuccess',
    failed: 'activity.statusFailed',
    pending: 'activity.statusPending',
  };
  const k = keys[status];
  return k ? t(k) : status;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/** Map MATIC to POL for display (Polygon rebrand) */
function mapAssetDisplay(text: string): string {
  return text.replace(/\bMATIC\b/gi, 'POL');
}

function canonicalizeSymbol(text: string | undefined | null): string {
  const raw = (text ?? '').trim().toUpperCase();
  if (!raw) return '';
  return raw === 'MATIC' ? 'POL' : raw;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CHAIN_NATIVE_SYMBOL_ALIASES: Record<string, string[]> = {
  polygon: ['POL', 'MATIC'],
  eth: ['ETH'],
  ethereum: ['ETH'],
  bnb: ['BNB'],
  'binance-smart-chain': ['BNB'],
  arb: ['ETH'],
  arbitrum: ['ETH'],
  opt: ['ETH'],
  optimism: ['ETH'],
  base: ['ETH'],
};

function matchesNativeChainAsset(symbol: string, chain: string | undefined, event: WalletEvent): boolean {
  if (!chain || event.type !== 'native_transfer') return false;
  const aliases = CHAIN_NATIVE_SYMBOL_ALIASES[chain.toLowerCase()] ?? [];
  const normalizedSymbol = canonicalizeSymbol(symbol);
  if (!aliases.map(canonicalizeSymbol).includes(normalizedSymbol)) return false;
  return event.chain.toLowerCase() === chain.toLowerCase();
}

type ActivityStyles = ReturnType<typeof buildActivityScreenStyles>;

// ── Event row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: WalletEvent;
  styles: ActivityStyles;
}

const MAX_SUMMARIES_VISIBLE = 3;

const EventRow: React.FC<EventRowProps> = ({ event, styles }) => {
  const { t } = useTranslation();
  const activity = event.activity;
  const txStatus = activity?.txStatus;
  const explorerUrl = activity?.explorerUrl;
  const txCount = event.transactionCount;
  const summaries = event.eventSummaries ?? [];

  const hasNewFormat = txCount != null && summaries.length > 0;
  const summaryLine = hasNewFormat
    ? `${txCount} ${txCount !== 1 ? t('activity.transactionPlural') : t('activity.transactionSingular')}, ${summaries.length} ${summaries.length !== 1 ? t('activity.eventPlural') : t('activity.eventSingular')}`
    : null;
  const visibleSummaries = summaries.slice(0, MAX_SUMMARIES_VISIBLE);
  const remainingCount = summaries.length - MAX_SUMMARIES_VISIBLE;

  return (
    <View style={styles.eventRow}>
      <View style={styles.eventLeft}>
        <View style={[styles.chainBadge]}>
          <Text style={styles.chainBadgeText}>{event.chain.toUpperCase()}</Text>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventType} numberOfLines={1}>
            {eventTypeLabel(t, event.type)}
          </Text>
          <Text style={styles.eventAddress}>{truncateAddress(event.address)}</Text>
          {txStatus && (
            <View style={[
              styles.statusBadge,
              txStatus === 'success' && styles.statusSuccess,
              txStatus === 'failed' && styles.statusFailed,
              txStatus === 'pending' && styles.statusPending,
            ]}>
              <Text style={styles.statusBadgeText}>
                {txStatusLabel(t, txStatus)}
              </Text>
            </View>
          )}
          {explorerUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(explorerUrl)}
              style={styles.explorerLink}
              activeOpacity={0.7}
            >
              <Text style={styles.explorerLinkText}>{t('activity.viewOnExplorer')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.eventRight}>
        <Text style={styles.eventTime}>{formatTime(event.aggregatedAt)}</Text>
        {(summaryLine || visibleSummaries.length > 0) && (
          <View style={styles.transactionDetails}>
            {summaryLine && (
              <Text style={styles.summaryLine}>{summaryLine}</Text>
            )}
            {visibleSummaries.length > 0 && (
              <View style={styles.eventSummaries}>
                {visibleSummaries.map((s, i) => (
                  <Text key={i} style={styles.eventSummaryItem} numberOfLines={2}>
                    • {mapAssetDisplay(s)}
                  </Text>
                ))}
                {remainingCount > 0 && (
                  <Text style={styles.eventSummaryMore}>{t('activity.andMore', { count: remainingCount })}</Text>
                )}
              </View>
            )}
          </View>
        )}
        {!hasNewFormat && event.rawEventCount > 1 && (
          <Text style={styles.eventCount}>×{event.rawEventCount}</Text>
        )}
      </View>
    </View>
  );
};

// ── Main screen ──────────────────────────────────────────────────────────────

interface ActivityScreenProps {
  symbol?: string;
  chain?: string;
  onClose: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ symbol, chain, onClose }) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildActivityScreenStyles(tokens), [tokens]);
  const { events } = usePortfolioStore();

  // Filter events by symbol if provided
  const filteredEvents = useMemo(() => {
    if (!symbol) return events;

    const normalizedSymbol = canonicalizeSymbol(symbol);
    const symbolPattern = new RegExp(`\\b${escapeRegExp(normalizedSymbol)}\\b`, 'i');

    return events.filter(event => {
      const summaries = event.eventSummaries ?? [];
      const summaryMatches = summaries.some((summary) =>
        symbolPattern.test(canonicalizeSymbol(summary))
      );
      const activityAsset = canonicalizeSymbol(event.activity?.asset);
      const nativeChainMatch = matchesNativeChainAsset(normalizedSymbol, chain, event);

      return summaryMatches || activityAsset === normalizedSymbol || nativeChainMatch;
    });
  }, [chain, events, symbol]);

  const renderItem = ({ item }: { item: WalletEvent }) => {
    return <EventRow event={item} styles={styles} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {symbol ? t('activity.titleWithSymbol', { symbol }) : t('activity.title')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('activity.transactionCount', { count: filteredEvents.length })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('activity.noActivityFound')}</Text>
            <Text style={styles.emptySubtitle}>
              {symbol ? t('activity.emptyForSymbol', { symbol }) : t('activity.empty')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

function buildActivityScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: sem.listMarginH,
      paddingTop: s.lg,
      paddingBottom: s.md,
      backgroundColor: sem.surface,
      borderBottomWidth: 1,
      borderBottomColor: tokens.borderSubtle,
      ...sem.cardShadow,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: typo.fontSizes.xl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
    },
    headerSubtitle: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      marginTop: s.xs,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: s.md,
    },
    closeButtonText: {
      fontSize: typo.fontSizes.xl,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[600],
    },
    listContent: {
      paddingTop: sem.listMarginH,
      paddingBottom: 120,
    },

    // ── Event row ──
    eventRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginHorizontal: sem.listMarginH,
      marginBottom: sem.listGap,
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadiusSmall,
      padding: sem.cardPadding,
      minHeight: 72,
      ...sem.cardShadow,
    },
    eventLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: s.sm,
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
    eventDetails: {
      flex: 1,
      minWidth: 0,
    },
    eventType: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[800],
    },
    eventAddress: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      marginTop: 2,
    },
    summaryLine: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[600],
      textAlign: 'right',
    },
    eventSummaries: {
      marginTop: s.xs,
      alignItems: 'flex-end',
    },
    eventSummaryItem: {
      fontSize: typo.fontSizes.sm,
      color: c.neutral[600],
      marginTop: 2,
      lineHeight: 18,
      textAlign: 'right',
    },
    eventSummaryMore: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[400],
      fontStyle: 'italic',
      marginTop: 2,
      textAlign: 'right',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      marginTop: s.xs,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      borderRadius: sem.cardRadiusSmall,
    },
    statusSuccess: {
      backgroundColor: '#d1fae5',
    },
    statusFailed: {
      backgroundColor: c.error[100],
    },
    statusPending: {
      backgroundColor: c.neutral[200],
    },
    statusBadgeText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[700],
    },
    explorerLink: {
      marginTop: s.xs,
      alignSelf: 'flex-start',
    },
    explorerLinkText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: c.primary[600],
    },
    eventRight: {
      alignItems: 'flex-end',
      flexShrink: 0,
      minWidth: 100,
    },
    transactionDetails: {
      marginTop: s.sm,
      alignItems: 'flex-end',
    },
    eventCount: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.primary[500],
    },
    eventTime: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[400],
      marginTop: 2,
    },

    // ── Empty state ──
    emptyContainer: {
      padding: s.xxl,
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[600],
      marginBottom: s.xs,
    },
    emptySubtitle: {
      fontSize: typo.fontSizes.sm,
      color: c.neutral[400],
      textAlign: 'center',
    },
  });
}
