import React, { useMemo } from 'react';
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

const EVENT_TYPE_LABELS: Record<string, string> = {
  token_transfer:       'Token Transfer',
  native_transfer:      'Native Transfer',
  contract_interaction: 'Contract Interaction',
  multi_chain_activity: 'Multi-Chain Activity',
};

const TX_STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  failed:  'Failed',
  pending: 'Pending',
};

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

type ActivityStyles = ReturnType<typeof buildActivityScreenStyles>;

// ── Event row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: WalletEvent;
  styles: ActivityStyles;
}

const MAX_SUMMARIES_VISIBLE = 3;

const EventRow: React.FC<EventRowProps> = ({ event, styles }) => {
  const activity = event.activity;
  const txStatus = activity?.txStatus;
  const explorerUrl = activity?.explorerUrl;
  const txCount = event.transactionCount;
  const summaries = event.eventSummaries ?? [];

  const hasNewFormat = txCount != null && summaries.length > 0;
  const summaryLine = hasNewFormat
    ? `${txCount} transaction${txCount !== 1 ? 's' : ''}, ${summaries.length} event${summaries.length !== 1 ? 's' : ''}`
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
            {EVENT_TYPE_LABELS[event.type] ?? event.type}
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
                {TX_STATUS_LABELS[txStatus] ?? txStatus}
              </Text>
            </View>
          )}
          {explorerUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(explorerUrl)}
              style={styles.explorerLink}
              activeOpacity={0.7}
            >
              <Text style={styles.explorerLinkText}>View on Explorer</Text>
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
                  <Text style={styles.eventSummaryMore}>
                    and {remainingCount} more
                  </Text>
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
  onClose: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ symbol, onClose }) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildActivityScreenStyles(tokens), [tokens]);
  const { events } = usePortfolioStore();

  // Filter events by symbol if provided
  const filteredEvents = useMemo(() => {
    if (!symbol) return events;
    
    return events.filter(event => {
      // Check if the event summaries contain the symbol
      const summaries = event.eventSummaries ?? [];
      const symbolPattern = new RegExp(`\\b${symbol}\\b`, 'i');
      
      return summaries.some(summary => symbolPattern.test(summary)) ||
             event.activity?.asset?.toUpperCase() === symbol.toUpperCase();
    });
  }, [events, symbol]);

  const renderItem = ({ item }: { item: WalletEvent }) => {
    return <EventRow event={item} styles={styles} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {symbol ? `${symbol} Activity` : 'Activity'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredEvents.length} transaction{filteredEvents.length !== 1 ? 's' : ''}
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
            <Text style={styles.emptyTitle}>No activity found</Text>
            <Text style={styles.emptySubtitle}>
              {symbol 
                ? `No transactions found for ${symbol}`
                : 'No transactions to display'
              }
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
