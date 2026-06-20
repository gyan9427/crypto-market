import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { usePiStyles } from './piStyles';
import type { PortfolioAnalyticsPayload } from '@/src/services/portfolioIntelligenceApi';

interface CategoryAllocationChartProps {
  analytics: PortfolioAnalyticsPayload | null;
}

const BAR_COLORS = ['#6383ff', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

export const CategoryAllocationChart: React.FC<CategoryAllocationChartProps> = ({ analytics }) => {
  const styles = usePiStyles();

  const categories = useMemo(() => {
    const byCategory = analytics?.allocation?.byCategory ?? {};
    return Object.entries(byCategory)
      .map(([id, pct]) => ({ id, pct, label: formatCategoryLabel(id) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);
  }, [analytics?.allocation?.byCategory]);

  const topCategory = analytics?.allocation?.topCategory;

  if (categories.length === 0) return null;

  const maxPct = categories[0]?.pct ?? 1;

  return (
    <View style={[styles.sectionWrap, styles.card]}>
      <Text style={styles.cardTitle}>Category Allocation</Text>
      {topCategory ? (
        <Text style={styles.cardSubtitle}>
          Top: {topCategory.name} ({topCategory.pct.toFixed(1)}%)
        </Text>
      ) : null}
      <View style={{ gap: 10, marginTop: 4 }}>
        {categories.map((item, index) => (
          <View key={item.id}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.barPct}>{item.pct.toFixed(1)}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(4, (item.pct / maxPct) * 100)}%`,
                    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

function formatCategoryLabel(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
