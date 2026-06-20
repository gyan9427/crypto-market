import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useCollapsibleNavHeaderScrollHandlers } from '@/src/hooks/useCollapsibleNavHeader';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { MonitorWalletSheet } from '../components/MonitorWalletSheet';
import { HoldingsSegment } from '../components/HoldingsSegment';
import { PortfolioAccountSelector } from '../components/PortfolioAccountSelector';
import { ActivityScreen } from './ActivityScreen';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePortfolioLiveStream } from '../hooks/usePortfolioLiveStream';
import { useRouter } from 'expo-router';
import { useHasFeature } from '@/src/utils/features';
import { usePortfolioIntelligence } from '@/src/hooks/portfolio-intelligence/usePortfolioIntelligence';
import { PortfolioInsightsCarousel } from '@/src/components/portfolio/PortfolioInsightsCarousel';
import { PortfolioGrowthChart } from '@/src/components/portfolio/PortfolioGrowthChart';
import {
  type GrowthPeriod,
} from '@/src/utils/portfolioGrowthSeries';

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

export const PortfolioScreen: React.FC = () => {
  const router = useRouter();
  const hasPiEngines = useHasFeature('portfolio_intelligence_engines');
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
  const openMonitorSheet = usePortfolioStore((state) => state.openMonitorSheet);
  const exchanges = usePortfolioStore((state) => state.exchanges);
  const exchangePortfolioEnabled = usePortfolioStore((state) => state.exchangePortfolioEnabled);
  const selectedAccount = usePortfolioStore((state) => state.selectedAccount);
  const setSelectedAccount = usePortfolioStore((state) => state.setSelectedAccount);
  const holdings = usePortfolioStore((state) => state.holdings);
  const holdingsLoading = usePortfolioStore((state) => state.holdingsLoading);

  const walletAddresses = useMemo(() => wallets.map((w) => w.address), [wallets]);
  const { isConnected: portfolioStreamConnected } = usePortfolioLiveStream({
    addresses: walletAddresses,
    enabled: walletAddresses.length > 0,
  });

  const {
    enabled: piEnabled,
    summary: piSummary,
    insights: piInsights,
    status: piStatus,
    evolution: piEvolution,
    loadEvolution,
  } = usePortfolioIntelligence({ autoLoad: hasPiEngines });

  const topPiInsight = piInsights[0] ?? null;
  const piLoading = piStatus === 'loading' || piStatus === 'idle';
  const showPiSummary = hasPiEngines && piEnabled;

  const handleOpenIntelligence = useCallback(() => {
    router.push('/(tabs)/portfolio/intelligence');
  }, [router]);

  const handleOpenComposition = useCallback(() => {
    router.push('/(tabs)/portfolio/composition');
  }, [router]);

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

  useEffect(() => {
    if (!hasPiEngines) return;
    void loadEvolution(90);
  }, [hasPiEngines, loadEvolution]);

  const handleGrowthPeriodChange = useCallback(
    (_period: GrowthPeriod) => {
      void loadEvolution(90);
    },
    [loadEvolution]
  );

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
  }, [canRunManualRefresh, loadEvents, loadExchanges, loadHoldings, loadWallets, markManualRefresh]);

  const handleHoldingPress = useCallback((holding: SelectedHolding) => {
    setSelectedHolding(holding);
    setShowActivity(true);
  }, []);

  const handleCloseActivity = useCallback(() => {
    setShowActivity(false);
    setSelectedHolding(null);
  }, []);

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
        <PortfolioAccountSelector
          wallets={wallets}
          exchanges={exchanges}
          exchangePortfolioEnabled={exchangePortfolioEnabled}
          selectedAccount={selectedAccount}
          sessionStatus={sessionStatus}
          onSelect={setSelectedAccount}
          onManageAccounts={openMonitorSheet}
        />
        <PortfolioGrowthChart
          selectedAccount={selectedAccount}
          holdings={holdings}
          evolution={piEvolution}
          wallets={wallets}
          exchanges={exchanges}
          loading={holdingsLoading || piLoading}
          onPeriodChange={handleGrowthPeriodChange}
        />
        <PortfolioInsightsCarousel
          holdings={holdings}
          holdingsLoading={holdingsLoading}
          selectedAccount={selectedAccount}
          wallets={wallets}
          exchanges={exchanges}
          showIntelligence={showPiSummary}
          piSummary={piSummary}
          topPiInsight={topPiInsight}
          piLoading={piLoading}
          onPressViewComposition={handleOpenComposition}
          onPressViewIntelligence={handleOpenIntelligence}
        />
        <HoldingsSegment selectedAccount={selectedAccount} onHoldingPress={handleHoldingPress} />
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
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    scrollContent: {
      paddingBottom: 96,
    },
  });
}
