import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SearchSegment } from '../services/api';
import { SearchBar } from './SearchBar';
import { borderRadius, colors, spacing, typography } from '../theme/theme';

const DEBOUNCE_MS = 300;

export type SegmentConfig = {
  id: SearchSegment;
  label: string;
};

export const DEFAULT_SEARCH_SEGMENTS: SegmentConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'coins', label: 'Coins' },
  { id: 'news', label: 'News' },
  { id: 'users', label: 'Users' },
  { id: 'newsBoards', label: 'News Boards' },
  { id: 'portfolioAssets', label: 'Portfolio' },
];

type UnifiedSearchInputProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedSegment: SearchSegment;
  onSegmentChange: (segment: SearchSegment) => void;
  segments: SearchSegment[];
  loading: boolean;
  error: string | null;
  resultCount: number;
  tookMs: number;
  isActive: boolean;
  placeholder?: string;
};

export const UnifiedSearchInput: React.FC<UnifiedSearchInputProps> = ({
  query,
  onQueryChange,
  selectedSegment,
  onSegmentChange,
  segments,
  loading,
  error,
  resultCount,
  tookMs,
  isActive,
  placeholder = 'Search coins, news, users...',
}) => {
  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from parent when query changes externally (e.g. URL param)
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleChangeText = useCallback(
    (text: string) => {
      setLocalQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        onQueryChange(text);
      }, DEBOUNCE_MS);
    },
    [onQueryChange]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const visibleSegments = DEFAULT_SEARCH_SEGMENTS.filter((item) => segments.includes(item.id));

  return (
    <View style={styles.container}>
      <SearchBar value={localQuery} onChangeText={handleChangeText} placeholder={placeholder} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentRow}>
        {visibleSegments.map((segment) => {
          const active = selectedSegment === segment.id;
          return (
            <TouchableOpacity
              key={segment.id}
              style={[styles.segmentChip, active && styles.segmentChipActive]}
              onPress={() => onSegmentChange(segment.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{segment.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isActive && (
        <View style={styles.statusRow}>
          {loading ? <ActivityIndicator size="small" color={colors.primary[500]} /> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!loading && !error ? (
            <Text style={styles.metaText}>
              {resultCount} result{resultCount === 1 ? '' : 's'} in {tookMs}ms
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[50],
  },
  segmentRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  segmentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
    backgroundColor: colors.neutral[100],
  },
  segmentChipActive: {
    backgroundColor: colors.primary[500],
  },
  segmentText: {
    color: colors.neutral[700],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  segmentTextActive: {
    color: colors.white,
  },
  statusRow: {
    minHeight: 24,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    justifyContent: 'center',
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  errorText: {
    color: colors.error[600],
    fontSize: typography.fontSizes.xs,
  },
});
