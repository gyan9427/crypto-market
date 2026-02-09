import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { borderRadius, shadows, spacing } from '../theme/theme';
import { colors } from '../theme/theme';

export const FeaturedCarouselSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <Skeleton width={100} height={22} style={styles.title} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.card}>
            <Skeleton width={280} height={140} borderRadius={borderRadius.card} style={styles.image} />
            <View style={styles.content}>
              <Skeleton width="100%" height={16} style={styles.marginBottom} />
              <Skeleton width="80%" height={16} style={styles.marginBottom} />
              <Skeleton width={120} height={12} />
            </View>
          </View>
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
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  card: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginRight: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  image: {
    marginBottom: 0,
  },
  content: {
    padding: spacing.md,
  },
  marginBottom: {
    marginBottom: spacing.xs,
  },
});
