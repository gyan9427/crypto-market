import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { ChainPills } from '../components/ChainPills';
import { Skeleton } from '../components/Skeleton';
import { WalletEvent } from '../types';
import { colors, spacing, borderRadius, shadows, typography } from '../theme/theme';

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

// ── Wallet chip (saved wallets row) ─────────────────────────────────────────

interface WalletChipProps {
  address: string;
  label?:  string;
  onRemove(): void;
}

const WalletChip: React.FC<WalletChipProps> = ({ address, label, onRemove }) => (
  <View style={styles.walletChip}>
    <Text style={styles.walletChipLabel} numberOfLines={1}>
      {label || truncateAddress(address)}
    </Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
      <Text style={styles.walletChipRemove}>✕</Text>
    </TouchableOpacity>
  </View>
);

// ── Main screen ──────────────────────────────────────────────────────────────

export const PortfolioScreen: React.FC = () => {
  const {
    wallets,
    supportedChains,
    events,
    isLoading,
    error,
    loadWallets,
    loadSupportedChains,
    loadEvents,
    addWallet,
    removeWallet,
    clearError,
  } = usePortfolioStore();

  const [refreshing, setRefreshing]         = useState(false);
  const [addressInput, setAddressInput]     = useState('');
  const [labelInput, setLabelInput]         = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [addError, setAddError]             = useState<string | null>(null);

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

  const toggleChain = useCallback((chainId: string) => {
    setSelectedChains((prev) =>
      prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId]
    );
  }, []);

  const handleAddWallet = useCallback(async () => {
    const trimmed = addressInput.trim();
    setAddError(null);
    clearError();

    if (!trimmed) {
      setAddError('Please enter a wallet address.');
      return;
    }
    if (selectedChains.length === 0) {
      setAddError('Please select at least one chain.');
      return;
    }

    try {
      await addWallet(trimmed, selectedChains, labelInput.trim() || undefined);
      setAddressInput('');
      setLabelInput('');
      setSelectedChains([]);
      loadEvents();
    } catch {
      // error is already set in the store
    }
  }, [addressInput, labelInput, selectedChains, addWallet, clearError, loadEvents]);

  const handleRemoveWallet = useCallback(
    (id: string) => {
      removeWallet(id);
    },
    [removeWallet]
  );

  const ListHeader = (
    <>
      {/* Section: Add wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitor a Wallet</Text>

        <Text style={styles.inputLabel}>Select Chains</Text>
        <ChainPills
          chains={supportedChains}
          selectedChains={selectedChains}
          onToggle={toggleChain}
        />

        <TextInput
          style={styles.input}
          placeholder="Wallet address (0x…)"
          placeholderTextColor={colors.neutral[400]}
          value={addressInput}
          onChangeText={setAddressInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
        />

        <TextInput
          style={[styles.input, styles.inputSmall]}
          placeholder="Label (optional)"
          placeholderTextColor={colors.neutral[400]}
          value={labelInput}
          onChangeText={setLabelInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {(addError || error) ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{addError || error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleAddWallet}
          disabled={isLoading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Adding…' : 'Add Wallet'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section: saved wallets */}
      {wallets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Wallets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletChipsRow}
          >
            {wallets.map((w) => (
              <WalletChip
                key={w.id}
                address={w.address}
                label={w.label}
                onRemove={() => handleRemoveWallet(w.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Events heading */}
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
                Add a wallet address above to start monitoring.
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
    paddingTop:    spacing.lg,
    paddingBottom: 120,
  },

  // ── Sections ──
  section: {
    marginHorizontal: spacing.lg,
    marginBottom:     spacing.md,
    backgroundColor:  '#fff',
    borderRadius:     borderRadius.md,
    padding:          spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize:     typography.fontSizes.md,
    fontWeight:   typography.fontWeights.semibold,
    color:        colors.neutral[800],
    marginBottom: spacing.sm,
  },

  // ── Input row ──
  inputLabel: {
    fontSize:     typography.fontSizes.sm,
    fontWeight:   typography.fontWeights.medium,
    color:        colors.neutral[600],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth:   1,
    borderColor:   colors.neutral[200],
    borderRadius:  borderRadius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    fontSize:      typography.fontSizes.base,
    color:         colors.neutral[800],
    marginTop:     spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  inputSmall: {
    paddingVertical: 8,
    fontSize:        typography.fontSizes.sm,
  },

  // ── Add button ──
  addButton: {
    marginTop:       spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius:    borderRadius.button,
    paddingVertical: spacing.sm,
    alignItems:      'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  addButtonText: {
    color:      '#fff',
    fontWeight: typography.fontWeights.semibold,
    fontSize:   typography.fontSizes.base,
  },

  // ── Error banner ──
  errorBanner: {
    marginTop:    spacing.sm,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.xs,
    padding:      spacing.sm,
  },
  errorBannerText: {
    color:    colors.error[700],
    fontSize: typography.fontSizes.sm,
  },

  // ── Wallet chips row ──
  walletChipsRow: {
    flexDirection: 'row',
    paddingRight:  spacing.xs,
  },
  walletChip: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.primary[50],
    borderColor:     colors.primary[200],
    borderWidth:     1,
    borderRadius:    borderRadius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical:   6,
    marginRight:     spacing.xs,
    maxWidth:        160,
  },
  walletChipLabel: {
    fontSize:   typography.fontSizes.sm,
    color:      colors.primary[700],
    fontWeight: typography.fontWeights.medium,
    flexShrink: 1,
    marginRight: 6,
  },
  walletChipRemove: {
    fontSize: 11,
    color:    colors.primary[400],
    fontWeight: typography.fontWeights.bold,
  },

  // ── Events heading ──
  eventsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xs,
    paddingBottom:     spacing.xs,
  },

  // ── Event row ──
  eventRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    marginHorizontal: spacing.lg,
    marginBottom:     spacing.sm,
    backgroundColor:  '#fff',
    borderRadius:     borderRadius.xs,
    padding:          spacing.md,
    ...shadows.sm,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
    marginRight:   spacing.sm,
  },
  chainBadge: {
    backgroundColor: colors.primary[100],
    borderRadius:    borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical:   4,
    marginRight:     spacing.sm,
  },
  chainBadgeText: {
    fontSize:   10,
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
    marginHorizontal: spacing.lg,
    marginBottom:     spacing.sm,
    borderRadius:     borderRadius.xs,
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
