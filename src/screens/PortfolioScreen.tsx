import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { MonitorWalletSheet } from '../components/MonitorWalletSheet';
import { HoldingsSegment } from '../components/HoldingsSegment';
import { ActivityScreen } from './ActivityScreen';
import { colors, spacing, typography, semantic } from '../theme/theme';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ── Main screen ──────────────────────────────────────────────────────────────

export const PortfolioScreen: React.FC = () => {
  const {
    wallets,
    isLoading,
    loadWallets,
    loadSupportedChains,
    loadEvents,
    loadHoldings,
    monitorSheetOpen,
    closeMonitorSheet,
  } = usePortfolioStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    console.log('[Holdings] PortfolioScreen mount: loading chains, wallets, events, holdings');
    loadSupportedChains();
    loadWallets();
    loadEvents();
    loadHoldings();
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log('[Holdings] PortfolioScreen handleRefresh: reloading wallets, events, holdings (forceRefresh)');
    setRefreshing(true);
    await Promise.all([loadWallets(), loadEvents(), loadHoldings(true)]);
    setRefreshing(false);
  }, [loadWallets, loadEvents, loadHoldings]);

  const handleHoldingPress = useCallback((symbol: string) => {
    console.log('[Holdings] Opening activity for symbol:', symbol);
    setSelectedSymbol(symbol);
    setShowActivity(true);
  }, []);

  const handleCloseActivity = useCallback(() => {
    setShowActivity(false);
    setSelectedSymbol(null);
  }, []);

  const accountLabel = wallets.length > 0
    ? `Account ${truncateAddress(wallets[0].address)}`
    : 'Account';

  // Show activity screen if requested
  if (showActivity) {
    return (
      <ActivityScreen 
        symbol={selectedSymbol ?? undefined} 
        onClose={handleCloseActivity} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <TouchableOpacity
          style={styles.accountCard}
          onPress={() => usePortfolioStore.getState().openMonitorSheet()}
          activeOpacity={0.8}
        >
          <Text style={styles.accountTitle}>{accountLabel}</Text>
        </TouchableOpacity>
        <HoldingsSegment onHoldingPress={handleHoldingPress} />
      </ScrollView>
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
  scrollContent: {
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
});
