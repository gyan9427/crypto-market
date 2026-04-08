import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { NewsItem } from '../types';
import { formatTimeAgo } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface FeaturedCarouselProps {
  items: NewsItem[];
  onItemPress?: (id: string) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  items,
  onItemPress,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildFeaturedCarouselStyles(tokens), [tokens]);

  const renderItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
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
          contentFit="cover"
          accessibilityLabel="Featured article image"
          transition={200}
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
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured</Text>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={2}
        maxToRenderPerBatch={1}
      />
    </View>
  );
};

function buildFeaturedCarouselStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      marginBottom: s.md,
    },
    title: {
      fontSize: typo.fontSizes.lg,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      paddingHorizontal: s.md,
      marginBottom: s.sm,
    },
    scrollContent: {
      paddingHorizontal: s.md,
      paddingVertical: s.xs,
    },
    card: {
      width: 280,
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadius,
      marginRight: s.md,
      ...sem.cardShadow,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 140,
      backgroundColor: c.neutral[200],
      borderTopLeftRadius: sem.cardRadius,
      borderTopRightRadius: sem.cardRadius,
    },
    content: {
      padding: s.md,
    },
    cardTitle: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      lineHeight: 20,
      marginBottom: s.sm,
    },
    meta: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
    },
  });
}
