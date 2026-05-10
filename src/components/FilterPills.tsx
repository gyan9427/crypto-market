import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ExploreCategory } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface FilterPillsProps {
  categories: ExploreCategory[];
  selectedCategory: ExploreCategory;
  onSelect: (category: ExploreCategory) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildFilterPillsStyles(tokens), [tokens]);

  const categoryLabels: Record<ExploreCategory, string> = useMemo(
    () => ({
      analysis: t('explore.analysis'),
      trending: t('explore.trending'),
      top: t('explore.top'),
    }),
    [t]
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = category === selectedCategory;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.pill, isSelected && styles.pillActive]}
            onPress={() => onSelect(category)}
            accessibilityRole="button"
            accessibilityLabel={categoryLabels[category]}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
              {categoryLabels[category]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

function buildFilterPillsStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      paddingHorizontal: s.lg,
      paddingVertical: s.sm,
      flexDirection: 'row',
      gap: s.sm,
    },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: tokens.borderRadius.pill,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tokens.border,
      minHeight: 34,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillActive: {
      backgroundColor: c.primary[500],
      borderColor: c.primary[500],
    },
    pillText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.textMuted,
      letterSpacing: typo.letterSpacing.button,
    },
    pillTextActive: {
      color: '#ffffff',
    },
  });
}
