import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { ExploreCategory } from '../types';
import { colors, borderRadius, spacing, shadows } from '../theme/theme';

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
  const categoryLabels: Record<ExploreCategory, string> = {
    trending: 'Trending',
    top: 'Top',
    nft: 'NFT',
    defi: 'DeFi',
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#fff',
    marginRight: spacing.xs,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  pillActive: {
    backgroundColor: colors.primary[500],
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  pillTextActive: {
    color: '#fff',
  },
});
