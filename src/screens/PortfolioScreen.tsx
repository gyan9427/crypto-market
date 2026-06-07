import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useCollapsibleNavHeaderScrollHandlers } from '@/src/hooks/useCollapsibleNavHeader';
import { useTranslation } from 'react-i18next';
import { Wallet } from 'lucide-react-native';
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
const MARKET_ACCENT = '#6383ff';

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
  const collapsibleScrollHandlers = useCollapsibleNavHeaderScrollHandlers();

  const wallets = usePortfolioStore((state) => state.wallets);
  const loadWallets = usePortfolioStore((state) => state.loadWallets);
  const loadSupportedChains = usePortfolioStore((state) => state.loadSupportedChains);
  const loadEvents = usePortfolioStore((state) => state.loadEvents);
  const loadHoldings = usePortfolioStore((state) => state.loadHoldings);
  const loadExchanges = usePortfolioStore((state) => state.loadExchanges);
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
    void loadExchanges();
    void loadHoldings(false, { modeOverride: 'bootstrap', triggerReason: 'bootstrap' });
    void loadEvents(1, PORTFOLIO_ACTIVITY_EVENT_LIMIT, {
      modeOverride: 'bootstrap',
      triggerReason: 'bootstrap',
    });
  }, [loadSupportedChains, loadWallets, loadExchanges, loadEvents, loadHoldings]);

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
      loadExchanges(),
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

  const sessionStatus = `${MODE_LABEL[sessionMode] ?? 'Syncing'} · ${portfolioStreamConnected ? 'Connected' : 'Disconnected'}`;

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
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        {...collapsibleScrollHandlers}
      >
        <Text style={styles.sectionTitle}>{t('portfolio.headerAccount')}</Text>
        <TouchableOpacity
          style={styles.accountRow}
          onPress={() => usePortfolioStore.getState().openMonitorSheet()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={accountLabel}
        >
          <View style={styles.accountIcon}>
            <Wallet size={18} color={MARKET_ACCENT} />
          </View>
          <View style={styles.identity}>
            <Text style={styles.accountTitle} numberOfLines={1}>
              {accountLabel}
            </Text>
            <Text style={styles.sessionLabel} numberOfLines={1}>
              {sessionStatus}
            </Text>
          </View>
        </TouchableOpacity>
        <HoldingsSegment onHoldingPress={handleHoldingPress} />
      </Animated.ScrollView>
      <MonitorWalletSheet
        visible={monitorSheetOpen}
        onClose={closeMonitorSheet}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

function buildPortfolioScreenStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    scrollContent: {
      paddingBottom: 96,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.textMuted,
      letterSpacing: 0.2,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? '#0a0a0f' : tokens.surface,
      minHeight: 56,
    },
    accountIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing.sm,
    },
    identity: {
      flex: 1,
      minWidth: 0,
    },
    accountTitle: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
      letterSpacing: typo.letterSpacing.caption,
    },
    sessionLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
  });
}
