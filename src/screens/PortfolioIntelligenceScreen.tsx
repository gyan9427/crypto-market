import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { usePortfolioIntelligence } from '@/src/hooks/portfolio-intelligence/usePortfolioIntelligence';
import { usePortfolioStore } from '@/src/state/usePortfolioStore';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { PortfolioHealthCard } from '@/src/components/portfolio-intelligence/PortfolioHealthCard';
import { InvestorIdentityCard } from '@/src/components/portfolio-intelligence/InvestorIdentityCard';
import { CategoryAllocationChart } from '@/src/components/portfolio-intelligence/CategoryAllocationChart';
import { NarrativeExposureBars } from '@/src/components/portfolio-intelligence/NarrativeExposureBars';
import { PortfolioInsightsList } from '@/src/components/portfolio-intelligence/PortfolioInsightsList';
import { PiSkeleton } from '@/src/components/portfolio-intelligence/PiSkeleton';
import { PiStaleBanner } from '@/src/components/portfolio-intelligence/PiStaleBanner';
import { PiAiAnalystPanel } from '@/src/components/portfolio-intelligence/PiAiAnalystPanel';
import { PiSimulationPanel } from '@/src/components/portfolio-intelligence/PiSimulationPanel';
import { MARKET_ACCENT } from '@/src/components/portfolio-intelligence/piStyles';

function formatUsd(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return '$0.00';
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const PortfolioIntelligenceScreen: React.FC = () => {
  const router = useRouter();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const holdings = usePortfolioStore((s) => s.holdings);
  const [refreshing, setRefreshing] = useState(false);

  const {
    enabled,
    summary,
    analytics,
    insights,
    status,
    mappingCoveragePct,
    error,
    refresh,
  } = usePortfolioIntelligence();

  const totalValue = useMemo(() => {
    const positions = holdings?.positions ?? [];
    return positions.reduce((sum, p) => sum + (p.value ?? 0), 0);
  }, [holdings?.positions]);

  const loading = status === 'loading' || status === 'idle';
  const lowMappingCoverage =
    mappingCoveragePct != null && mappingCoveragePct < 85;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (!enabled) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Portfolio intelligence is not available.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIcon}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={tokens.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Portfolio Intelligence</Text>
          <Text style={styles.headerSubtitle}>{formatUsd(totalValue)} total value</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {status === 'stale' ? (
          <PiStaleBanner
            message="Analytics may be outdated. Pull to refresh for the latest snapshot."
            onRefresh={handleRefresh}
          />
        ) : null}

        {lowMappingCoverage ? (
          <PiStaleBanner message="Some holdings could not be categorized. Insights may be incomplete." />
        ) : null}

        {error ? (
          <PiStaleBanner message={error} onRefresh={handleRefresh} refreshLabel="Retry" />
        ) : null}

        {loading && !summary && !analytics ? (
          <>
            <PiSkeleton variant="section" />
            <PiSkeleton variant="section" />
            <PiSkeleton variant="section" />
          </>
        ) : (
          <>
            <PortfolioHealthCard summary={summary} analytics={analytics} />
            <InvestorIdentityCard summary={summary} analytics={analytics} />
            <CategoryAllocationChart analytics={analytics} />
            <NarrativeExposureBars analytics={analytics} />
            <PortfolioInsightsList insights={insights.length > 0 ? insights : analytics?.insights ?? []} />
            <PiSimulationPanel analytics={analytics} />
            <PiAiAnalystPanel />
            {!summary && !analytics && status === 'ready' ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>Analyzing portfolio…</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.headerBorder,
      backgroundColor: tokens.headerBg,
    },
    backIcon: {
      padding: 6,
      marginRight: 4,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    headerSubtitle: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
    },
    scrollContent: {
      paddingBottom: 96,
    },
    emptyBlock: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      textAlign: 'center',
    },
    backBtn: {
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    backBtnText: {
      color: MARKET_ACCENT,
      fontWeight: typo.fontWeights.semibold,
    },
  });
}
