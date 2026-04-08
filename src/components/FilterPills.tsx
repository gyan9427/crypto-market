import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
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
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildFilterPillsStyles(tokens), [tokens]);

  const categoryLabels: Record<ExploreCategory, string> = {
    trending: 'Trending',
    top: 'Top',
  };

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
  return StyleSheet.create({
    container: {
      paddingHorizontal: 24,
      paddingVertical: s.xs,
      flexDirection: 'row',
    },
    pill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 9999,
      backgroundColor: tokens.surface,
      marginRight: s.xs,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
      ...tokens.shadows.sm,
    },
    pillActive: {
      backgroundColor: c.primary[500],
    },
    pillText: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.textMuted,
    },
    pillTextActive: {
      color: c.white,
    },
  });
}
