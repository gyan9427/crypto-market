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
import { colors, spacing, typography, semantic } from '../theme/theme';

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

// ── Event row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: WalletEvent;
}

const MAX_SUMMARIES_VISIBLE = 3;

const EventRow: React.FC<EventRowProps> = ({ event }) => {
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
    return <EventRow event={item} />;
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

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: semantic.listMarginH,
    paddingTop:       spacing.lg,
    paddingBottom:    spacing.md,
    backgroundColor:  semantic.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    ...semantic.cardShadow,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize:   typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color:      colors.neutral[900],
  },
  headerSubtitle: {
    fontSize:  typography.fontSizes.sm,
    color:     colors.neutral[500],
    marginTop: spacing.xs,
  },
  closeButton: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.neutral[100],
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      spacing.md,
  },
  closeButtonText: {
    fontSize:   typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color:      colors.neutral[600],
  },
  listContent: {
    paddingTop:    semantic.listMarginH,
    paddingBottom: 120,
  },

  // ── Event row ──
  eventRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'flex-start',
    marginHorizontal: semantic.listMarginH,
    marginBottom:     semantic.listGap,
    backgroundColor:  semantic.surface,
    borderRadius:     semantic.cardRadiusSmall,
    padding:          semantic.cardPadding,
    minHeight:        72,
    ...semantic.cardShadow,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    flex:          1,
    marginRight:   spacing.sm,
    minWidth:      0,
  },
  chainBadge: {
    backgroundColor:   colors.primary[100],
    borderRadius:      semantic.cardRadiusSmall,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    marginRight:       spacing.sm,
  },
  chainBadgeText: {
    fontSize:   typography.fontSizes.badge,
    fontWeight: typography.fontWeights.bold,
    color:      colors.primary[700],
  },
  eventDetails: {
    flex:        1,
    minWidth:    0,
  },
  eventType: {
    fontSize:   typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color:      colors.neutral[800],
  },
  eventAddress: {
    fontSize:  typography.fontSizes.sm,
    color:     colors.neutral[500],
    marginTop: 2,
  },
  summaryLine: {
    fontSize:    typography.fontSizes.sm,
    fontWeight:  typography.fontWeights.medium,
    color:       colors.neutral[600],
    textAlign:   'right',
  },
  eventSummaries: {
    marginTop:   spacing.xs,
    alignItems:  'flex-end',
  },
  eventSummaryItem: {
    fontSize:   typography.fontSizes.sm,
    color:     colors.neutral[600],
    marginTop: 2,
    lineHeight: 18,
    textAlign: 'right',
  },
  eventSummaryMore: {
    fontSize:   typography.fontSizes.xs,
    color:     colors.neutral[400],
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
  },
  statusBadge: {
    alignSelf:       'flex-start',
    marginTop:       spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical:  spacing.xs,
    borderRadius:    semantic.cardRadiusSmall,
  },
  statusSuccess: {
    backgroundColor: '#d1fae5',
  },
  statusFailed: {
    backgroundColor: colors.error[100],
  },
  statusPending: {
    backgroundColor: colors.neutral[200],
  },
  statusBadgeText: {
    fontSize:   typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color:      colors.neutral[700],
  },
  explorerLink: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  explorerLinkText: {
    fontSize:   typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color:      colors.primary[600],
  },
  eventRight: {
    alignItems:  'flex-end',
    flexShrink:  0,
    minWidth:    100,
  },
  transactionDetails: {
    marginTop:   spacing.sm,
    alignItems:  'flex-end',
  },
  eventCount: {
    fontSize:   typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color:      colors.primary[500],
  },
  eventTime: {
    fontSize:  typography.fontSizes.xs,
    color:     colors.neutral[400],
    marginTop: 2,
  },

  // ── Empty state ──
  emptyContainer: {
    padding:    spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize:     typography.fontSizes.md,
    fontWeight:   typography.fontWeights.semibold,
    color:        colors.neutral[600],
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize:  typography.fontSizes.sm,
    color:     colors.neutral[400],
    textAlign: 'center',
  },
});
