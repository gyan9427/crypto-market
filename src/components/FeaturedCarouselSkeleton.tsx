import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export const FeaturedCarouselSkeleton: React.FC = () => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildFeaturedCarouselSkeletonStyles(tokens), [tokens]);
  const br = tokens.borderRadius;

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
            <Skeleton width={280} height={140} borderRadius={br.card} style={styles.image} />
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

function buildFeaturedCarouselSkeletonStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    container: {
      marginBottom: s.md,
    },
    title: {
      marginLeft: s.md,
      marginBottom: s.sm,
    },
    scrollContent: {
      paddingHorizontal: s.md,
      paddingVertical: 4,
    },
    card: {
      width: 280,
      backgroundColor: tokens.surface,
      borderRadius: br.card,
      marginRight: s.md,
      ...tokens.shadows.md,
      overflow: 'hidden',
    },
    image: {
      marginBottom: 0,
    },
    content: {
      padding: s.md,
    },
    marginBottom: {
      marginBottom: s.xs,
    },
  });
}
