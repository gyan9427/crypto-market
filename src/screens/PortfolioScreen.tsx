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
import { usePortfolioLiveStream } from '../hooks/usePortfolioLiveStream';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const PORTFOLIO_ACTIVITY_EVENT_LIMIT = 100;

type SelectedHolding = {
  symbol: string;
  chain: string;
};

const MODE_LABEL: Record<string, string> = {
  bootstrap: 'Syncing',
  live: 'Live',
  degraded: 'Reconnecting',
  recovery: 'Recovering',
};

// ── Main screen ──────────────────────────────────────────────────────────────

export const PortfolioScreen: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildPortfolioScreenStyles(tokens), [tokens]);

  const wallets = usePortfolioStore((state) => state.wallets);
  const loadWallets = usePortfolioStore((state) => state.loadWallets);
  const loadSupportedChains = usePortfolioStore((state) => state.loadSupportedChains);
  const loadEvents = usePortfolioStore((state) => state.loadEvents);
  const loadHoldings = usePortfolioStore((state) => state.loadHoldings);
  const runRecoverySync = usePortfolioStore((state) => state.runRecoverySync);
  const sessionMode = usePortfolioStore((state) => state.sessionMode);
  const canRunManualRefresh = usePortfolioStore((state) => state.canRunManualRefresh);
  const markManualRefresh = usePortfolioStore((state) => state.markManualRefresh);
  const monitorSheetOpen = usePortfolioStore((state) => state.monitorSheetOpen);
  const closeMonitorSheet = usePortfolioStore((state) => state.closeMonitorSheet);

  const walletAddresses = useMemo(() => wallets.map((w) => w.address), [wallets]);
  const { isConnected: portfolioStreamConnected } = usePortfolioLiveStream({
    addresses: walletAddresses,
    enabled: walletAddresses.length > 0,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<SelectedHolding | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    loadSupportedChains();
    void loadWallets();
    void loadHoldings(false, { modeOverride: 'bootstrap', triggerReason: 'bootstrap' });
    void loadEvents(1, PORTFOLIO_ACTIVITY_EVENT_LIMIT, {
      modeOverride: 'bootstrap',
      triggerReason: 'bootstrap',
    });
  }, [loadSupportedChains, loadWallets, loadEvents, loadHoldings]);

  useEffect(() => {
    if (sessionMode !== 'degraded') return;
    void runRecoverySync(PORTFOLIO_ACTIVITY_EVENT_LIMIT);
  }, [runRecoverySync, sessionMode]);

  const handleRefresh = useCallback(async () => {
    if (!canRunManualRefresh()) return;
    markManualRefresh();

    setRefreshing(true);
    await Promise.all([
      loadWallets(),
      loadEvents(1, PORTFOLIO_ACTIVITY_EVENT_LIMIT, { triggerReason: 'manual_refresh' }),
      loadHoldings(true, { triggerReason: 'manual_refresh' }),
    ]);
    setRefreshing(false);
  }, [canRunManualRefresh, loadEvents, loadHoldings, loadWallets, markManualRefresh]);

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
          <Text style={styles.sessionLabel}>
            {MODE_LABEL[sessionMode] ?? 'Syncing'} · {portfolioStreamConnected ? 'Connected' : 'Disconnected'}
          </Text>
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
    sessionLabel: {
      marginTop: 6,
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
  });
}
