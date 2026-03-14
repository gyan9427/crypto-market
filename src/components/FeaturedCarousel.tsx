import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NewsItem } from '../types';
import { formatTimeAgo } from '../utils/format';
import { colors, borderRadius, shadows, spacing, semantic, typography } from '../theme/theme';

interface FeaturedCarouselProps {
  items: NewsItem[];
  onItemPress?: (id: string) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  items,
  onItemPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => onItemPress?.(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Featured: ${item.title}`}
            activeOpacity={0.9}
          >
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                accessibilityLabel="Featured article image"
                resizeMode="cover"
              />
            )}
            <View style={styles.content}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.meta}>
                {item.source} • {formatTimeAgo(item.publishedAt)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  card: {
    width: 280,
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadius,
    marginRight: spacing.md,
    ...semantic.cardShadow,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.neutral[200],
    borderTopLeftRadius: semantic.cardRadius,
    borderTopRightRadius: semantic.cardRadius,
  },
  content: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  meta: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
});
