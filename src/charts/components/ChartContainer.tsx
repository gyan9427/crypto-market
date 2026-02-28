import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../theme/theme';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  loading = false,
  error = null,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {loading ? (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : error ? (
          <View style={styles.placeholder}>
            <Text style={styles.errorText}>{error}</Text>
            {onRetry && (
              <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
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
    color: colors.neutral[900],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  retryText: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },
});
