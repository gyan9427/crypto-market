import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildFeaturedCarouselStyles(tokens), [tokens]);

  const renderItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onItemPress?.(item.id)}
      accessibilityRole="button"
      accessibilityLabel={t('featured.featuredWithTitle', { title: item.title })}
      activeOpacity={0.88}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={t('accessibility.featuredImage')}
          transition={200}
        />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        style={styles.imageOverlay}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText} numberOfLines={1}>
            {item.source}
          </Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {formatTimeAgo(item.publishedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>{t('featured.title').toUpperCase()}</Text>
      </View>
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
  const typo = tokens.typography;
  const cardShadow = Platform.select({
    web: {
      boxShadow: tokens.isDark
        ? '0 12px 40px rgba(0,0,0,0.35)'
        : '0 8px 32px rgba(88,28,135,0.15), 0 2px 8px rgba(0,0,0,0.06)',
    },
    default: tokens.shadows.md,
  });
  return StyleSheet.create({
    container: {
      marginBottom: s.md,
    },
    sectionHeader: {
      paddingHorizontal: s.md,
      marginBottom: s.sm,
    },
    eyebrow: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: c.primary[tokens.isDark ? 400 : 600],
      letterSpacing: typo.letterSpacing.eyebrow,
    },
    scrollContent: {
      paddingHorizontal: s.md,
      paddingVertical: s.xs,
      gap: s.md,
    },
    card: {
      width: 288,
      borderRadius: tokens.borderRadius.lg,
      borderWidth: 1,
      borderColor: tokens.isDark ? 'rgba(168,85,247,0.20)' : 'rgba(168,85,247,0.18)',
      overflow: 'hidden',
      position: 'relative',
      ...cardShadow,
    },
    image: {
      width: '100%',
      height: 160,
      backgroundColor: c.neutral[tokens.isDark ? 800 : 200],
    },
    imagePlaceholder: {
      width: '100%',
      height: 160,
      backgroundColor: tokens.isDark
        ? 'rgba(168,85,247,0.10)'
        : 'rgba(168,85,247,0.06)',
    },
    imageOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 100,
    },
    content: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: s.md,
    },
    sourceBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(168,85,247,0.80)',
      borderRadius: tokens.borderRadius.xs,
      paddingHorizontal: s.sm,
      paddingVertical: 3,
      marginBottom: s.xs,
    },
    sourceBadgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: '#ffffff',
      letterSpacing: typo.letterSpacing.button,
    },
    cardTitle: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: '#ffffff',
      lineHeight: 22,
      letterSpacing: typo.letterSpacing.subheading * 0.5,
      marginBottom: 4,
    },
    meta: {
      fontSize: typo.fontSizes.xs,
      fontFamily: typo.fontFamilies.sans,
      color: 'rgba(255,255,255,0.70)',
      letterSpacing: typo.letterSpacing.caption,
    },
  });
}
