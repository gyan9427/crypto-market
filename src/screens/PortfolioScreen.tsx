import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ── Main screen ──────────────────────────────────────────────────────────────

export const PortfolioScreen: React.FC = () => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildPortfolioScreenStyles(tokens), [tokens]);

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

function buildPortfolioScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    scrollContent: {
      paddingTop: sem.listMarginH,
      paddingBottom: 120,
    },

    accountCard: {
      marginHorizontal: sem.listMarginH,
      marginBottom: sem.listGap,
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadius,
      padding: sem.cardPadding,
      ...sem.cardShadow,
    },
    accountTitle: {
      fontSize: typo.fontSizes.xl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
    },
  });
}
