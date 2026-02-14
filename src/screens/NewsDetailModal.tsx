import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X, Heart, Share2, Bookmark } from 'lucide-react-native';
import { NewsItem } from '../types';
import { CoinChip } from '../components/CoinChip';
import { formatDateTime } from '../utils/format';
import { colors, spacing, borderRadius } from '../theme/theme';

interface NewsDetailModalProps {
  newsItem: NewsItem;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  newsItem,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {newsItem.imageUrl && (
          <Image
            source={{ uri: newsItem.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Like article"
              onPress={() => {
                // Placeholder like handler for mock detail view
                console.log('Like article:', newsItem.id);
              }}
            >
              <Heart size={20} color={colors.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Share article"
              onPress={() => {
                console.log('Share article:', newsItem.id);
              }}
            >
              <Share2 size={20} color={colors.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Save article"
              onPress={() => {
                console.log('Save article:', newsItem.id);
              }}
            >
              <Bookmark size={20} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{newsItem.title}</Text>

          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {newsItem.source} • {formatDateTime(newsItem.publishedAt)}
            </Text>
            {newsItem.author && (
              <Text style={styles.metaText}>By {newsItem.author}</Text>
            )}
          </View>

          {newsItem.coins.length > 0 && (
            <View style={styles.coinsSection}>
              <Text style={styles.sectionTitle}>Related Coins</Text>
              <View style={styles.coinsRow}>
                {newsItem.coins.map((coin) => (
                  <CoinChip key={coin.id} coin={coin} />
                ))}
              </View>
            </View>
          )}

          <Text style={styles.bodyText}>{newsItem.content || newsItem.snippet}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.neutral[200],
  },
  content: {
    padding: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.neutral[100],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  meta: {
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: 13,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  coinsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  coinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.neutral[700],
  },
});
