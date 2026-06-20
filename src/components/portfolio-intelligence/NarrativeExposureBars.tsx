import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { usePiStyles } from './piStyles';
import type { PortfolioAnalyticsPayload } from '@/src/services/portfolioIntelligenceApi';

interface NarrativeExposureBarsProps {
  analytics: PortfolioAnalyticsPayload | null;
}

export const NarrativeExposureBars: React.FC<NarrativeExposureBarsProps> = ({ analytics }) => {
  const styles = usePiStyles();

  const narratives = useMemo(() => {
    const ranked = analytics?.narrative?.ranked ?? [];
    if (ranked.length > 0) {
      return ranked.slice(0, 5);
    }
    const vector = analytics?.narrative?.vector ?? {};
    return Object.entries(vector)
      .map(([id, pct]) => ({
        id,
        name: formatNarrativeLabel(id),
        pct,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [analytics?.narrative]);

  if (narratives.length === 0) return null;

  const maxPct = narratives[0]?.pct ?? 1;

  return (
    <View style={[styles.sectionWrap, styles.card]}>
      <Text style={styles.cardTitle}>Narrative Exposure</Text>
      {analytics?.narrative?.dominant ? (
        <Text style={styles.cardSubtitle}>
          Dominant: {analytics.narrative.dominant.name} ({analytics.narrative.dominant.pct.toFixed(1)}%)
        </Text>
      ) : null}
      <View style={{ gap: 10, marginTop: 4 }}>
        {narratives.map((item) => (
          <View key={item.id}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.barPct}>{item.pct.toFixed(1)}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(4, (item.pct / maxPct) * 100)}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

function formatNarrativeLabel(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
