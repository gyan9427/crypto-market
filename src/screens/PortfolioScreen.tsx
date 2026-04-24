import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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

const PORTFOLIO_ACTIVITY_EVENT_LIMIT = 100;

type SelectedHolding = {
  symbol: string;
  chain: string;
};

// ── Main screen ──────────────────────────────────────────────────────────────

export const PortfolioScreen: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildPortfolioScreenStyles(tokens), [tokens]);

  const wallets = usePortfolioStore((state) => state.wallets);
  const loadWallets = usePortfolioStore((state) => state.loadWallets);
  const loadSupportedChains = usePortfolioStore((state) => state.loadSupportedChains);
  const loadEvents = usePortfolioStore((state) => {
    return state.loadEvents;
  });
  const loadHoldings = usePortfolioStore((state) => state.loadHoldings);
  const monitorSheetOpen = usePortfolioStore((state) => state.monitorSheetOpen);
  const closeMonitorSheet = usePortfolioStore((state) => state.closeMonitorSheet);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<SelectedHolding | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    loadSupportedChains();
    loadWallets();
    loadHoldings();
    void loadEvents(1, PORTFOLIO_ACTIVITY_EVENT_LIMIT);
  }, [loadSupportedChains, loadWallets, loadEvents, loadHoldings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadWallets(),
      loadEvents(1, PORTFOLIO_ACTIVITY_EVENT_LIMIT),
      loadHoldings(true),
    ]);
    setRefreshing(false);
  }, [loadWallets, loadEvents, loadHoldings]);

  const handleHoldingPress = useCallback((holding: SelectedHolding) => {
    setSelectedHolding(holding);
    setShowActivity(true);
  }, []);

  const handleCloseActivity = useCallback(() => {
    setShowActivity(false);
    setSelectedHolding(null);
  }, []);

  const accountLabel = wallets.length > 0
    ? t('portfolio.accountWithAddress', { address: truncateAddress(wallets[0].address) })
    : t('portfolio.headerAccount');

  // Show activity screen if requested
  if (showActivity) {
    return (
      <ActivityScreen 
        symbol={selectedHolding?.symbol}
        chain={selectedHolding?.chain}
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
