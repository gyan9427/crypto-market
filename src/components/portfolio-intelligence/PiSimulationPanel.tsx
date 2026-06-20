import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { usePiStyles } from './piStyles';
import { useHasFeature } from '@/src/utils/features';
import type { PortfolioAnalyticsPayload } from '@/src/services/portfolioIntelligenceApi';
import { simulatePortfolioWhatIf } from '@/src/services/portfolioIntelligenceApi';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { getMarketUiPalette } from '@/src/theme/chartPalette';

interface PiSimulationPanelProps {
  analytics: PortfolioAnalyticsPayload | null;
}

export const PiSimulationPanel: React.FC<PiSimulationPanelProps> = ({ analytics }) => {
  const styles = usePiStyles();
  const { tokens } = useAppTheme();
  const ui = useMemo(() => getMarketUiPalette(tokens), [tokens]);
  const localStyles = useMemo(() => buildLocalStyles(tokens, ui), [tokens, ui]);
  const enabled = useHasFeature('portfolio_intelligence_simulation');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    healthLabel: string;
    healthScore: number | null;
    riskLabel: string;
    disclaimer: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topSymbol = useMemo(() => analytics?.concentration?.topHolding ?? null, [analytics]);

  const runSimulation = useCallback(async () => {
    if (!topSymbol || loading) return;
    setLoading(true);
    setError(null);
    try {
      const sim = await simulatePortfolioWhatIf({
        label: `Reduce ${topSymbol} by 5%`,
        adjustments: [{ action: 'set_weight', symbol: topSymbol, deltaPct: -5 }],
      });
      if (!sim) {
        setError('Simulation unavailable.');
        return;
      }
      setResult({
        healthLabel: String(sim.health?.healthLabel ?? 'Unknown'),
        healthScore: sim.health?.healthScore ?? null,
        riskLabel: String(sim.risk?.riskLabel ?? 'Unknown'),
        disclaimer: sim.disclaimer,
      });
    } finally {
      setLoading(false);
    }
  }, [topSymbol, loading]);

  if (!enabled || !topSymbol) return null;

  return (
    <View style={[styles.sectionWrap, styles.card]}>
      <Text style={styles.cardTitle}>What-if simulation</Text>
      <Text style={styles.cardSubtitle}>
        Preview how reducing {topSymbol} by 5% might shift health and risk scores.
      </Text>
      <TouchableOpacity
        onPress={() => void runSimulation()}
        style={localStyles.runBtn}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Run portfolio what-if simulation"
      >
        {loading ? (
          <ActivityIndicator size="small" color={ui.accent} />
        ) : (
          <Text style={localStyles.runBtnText}>Run simulation</Text>
        )}
      </TouchableOpacity>
      {error ? <Text style={localStyles.errorText}>{error}</Text> : null}
      {result ? (
        <View style={localStyles.resultBox}>
          <Text style={styles.metricLabel}>
            Health {result.healthScore != null ? Math.round(result.healthScore) : '—'} ·{' '}
            {result.healthLabel}
          </Text>
          <Text style={styles.metricLabel}>Risk · {result.riskLabel}</Text>
          <Text style={[styles.insightSummary, { marginTop: 8 }]}>{result.disclaimer}</Text>
        </View>
      ) : null}
    </View>
  );
};

function buildLocalStyles(
  tokens: ReturnType<typeof useAppTheme>['tokens'],
  ui: ReturnType<typeof getMarketUiPalette>
) {
  return StyleSheet.create({
    runBtn: {
      alignSelf: 'flex-start',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 120,
      alignItems: 'center',
    },
    runBtnText: {
      color: ui.accent,
      fontWeight: '600',
    },
    errorText: {
      marginTop: 8,
      color: tokens.colors.error[500],
      fontSize: 13,
    },
    resultBox: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
  });
}
