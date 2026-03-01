import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../theme/theme';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Removes left/right margin, border radius and shadows */
  flush?: boolean;
  /** Render transparent card (useful for dark headers) */
  transparent?: boolean;
  /** Use light text (when parent has dark background) */
  darkBackground?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  loading = false,
  error = null,
  onRetry,
  flush = false,
  transparent = false,
  darkBackground = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' || darkBackground;

  const titleColor = transparent
    ? (isDark ? colors.neutral[50] : colors.neutral[900])
    : colors.neutral[900];
  const errorColor = transparent
    ? (isDark ? colors.neutral[400] : colors.neutral[600])
    : colors.neutral[500];
  const retryColor = colors.primary[500];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, flush && styles.titleFlush, { color: titleColor }]}>{title}</Text>
      <View
        style={[
          styles.card,
          flush && styles.cardFlush,
          transparent && styles.cardTransparent,
        ]}
      >
        {loading ? (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : error ? (
          <View style={styles.placeholder}>
            <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>
            {onRetry && (
              <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: retryColor }]}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: spacing.md,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  titleFlush: {
    paddingHorizontal: 0,
  },
  card: {
    height: 200,
    minHeight: 200,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  cardFlush: {
    marginHorizontal: 0,
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardTransparent: {
    backgroundColor: 'rgba(0,0,0,0)',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
