import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { MonitorWalletSheet } from '../components/MonitorWalletSheet';
import { Skeleton } from '../components/Skeleton';
import { WalletEvent } from '../types';
import { colors, spacing, borderRadius, shadows, typography, semantic } from '../theme/theme';

const EVENT_TYPE_LABELS: Record<string, string> = {
  token_transfer:       'Token Transfer',
  native_transfer:      'Native Transfer',
  contract_interaction: 'Contract Interaction',
  multi_chain_activity: 'Multi-Chain Activity',
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

// ── Event row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: WalletEvent;
}

const EventRow: React.FC<EventRowProps> = ({ event }) => (
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
      </View>
    </View>
    <View style={styles.eventRight}>
      <Text style={styles.eventCount}>
        {event.rawEventCount > 1 ? `×${event.rawEventCount}` : ''}
      </Text>
      <Text style={styles.eventTime}>{formatTime(event.aggregatedAt)}</Text>
    </View>
  </View>
);

// ── Main screen ──────────────────────────────────────────────────────────────

export const PortfolioScreen: React.FC = () => {
  const {
    wallets,
    events,
    isLoading,
    loadWallets,
    loadSupportedChains,
    loadEvents,
    monitorSheetOpen,
    closeMonitorSheet,
  } = usePortfolioStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSupportedChains();
    loadWallets();
    loadEvents();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadWallets(), loadEvents()]);
    setRefreshing(false);
  }, [loadWallets, loadEvents]);

  const accountLabel = wallets.length > 0
    ? `Account ${truncateAddress(wallets[0].address)}`
    : 'Account';

  const ListHeader = (
    <>
      <TouchableOpacity
        style={styles.accountCard}
        onPress={() => usePortfolioStore.getState().openMonitorSheet()}
        activeOpacity={0.8}
      >
        <Text style={styles.accountTitle}>{accountLabel}</Text>
      </TouchableOpacity>
      <View style={styles.eventsHeader}>
        <Text style={styles.sectionTitle}>Activity</Text>
      </View>
    </>
  );

  const renderItem = useCallback(
    ({ item, index }: { item: WalletEvent | null; index: number }) => {
      if (!item) {
        return <Skeleton key={`sk-${index}`} style={styles.skeletonRow} />;
      }
      return <EventRow event={item} />;
    },
    []
  );

  const showSkeletons = isLoading && events.length === 0;
  const listData: (WalletEvent | null)[] = showSkeletons
    ? Array(5).fill(null)
    : events;

  return (
    <View style={styles.container}>
      <FlatList
        data={listData as WalletEvent[]}
        keyExtractor={(item, index) => (item ? item.id : `sk-${index}`)}
        renderItem={renderItem as any}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap Account above to add a wallet and start monitoring.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      <MonitorWalletSheet
        visible={monitorSheetOpen}
        onClose={closeMonitorSheet}
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
  listContent: {
    paddingTop:    semantic.listMarginH,
    paddingBottom: 120,
  },

  accountCard: {
    marginHorizontal:  semantic.listMarginH,
    marginBottom:      semantic.listGap,
    backgroundColor:  semantic.surface,
    borderRadius:     semantic.cardRadius,
    padding:          semantic.cardPadding,
    ...semantic.cardShadow,
  },
  accountTitle: {
    fontSize:   typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color:      colors.neutral[900],
  },
  sectionTitle: {
    fontSize:     typography.fontSizes.md,
    fontWeight:   typography.fontWeights.semibold,
    color:        colors.neutral[800],
    marginBottom: spacing.sm,
  },

  // ── Events heading ──
  eventsHeader: {
    paddingHorizontal: semantic.listMarginH,
    paddingTop:        spacing.xs,
    paddingBottom:     spacing.xs,
  },

  // ── Event row ──
  eventRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    marginHorizontal: semantic.listMarginH,
    marginBottom:     semantic.listGap,
    backgroundColor:  semantic.surface,
    borderRadius:     semantic.cardRadiusSmall,
    padding:          semantic.cardPadding,
    ...semantic.cardShadow,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
    marginRight:   spacing.sm,
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
    flex: 1,
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
  eventRight: {
    alignItems: 'flex-end',
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

  // ── Skeleton ──
  skeletonRow: {
    height:           68,
    marginHorizontal: semantic.listMarginH,
    marginBottom:     semantic.listGap,
    borderRadius:     semantic.cardRadiusSmall,
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
