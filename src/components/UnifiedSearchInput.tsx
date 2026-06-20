import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { SearchSegment } from '../services/api';
import { SearchBar } from './SearchBar';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const DEBOUNCE_MS = 300;

export type SegmentConfig = {
  id: SearchSegment;
  label: string;
};

/** Segment ids in default filter order (labels come from i18n in UnifiedSearchInput). */
export const SEARCH_SEGMENT_ORDER: SearchSegment[] = [
  'all',
  'coins',
  'news',
  'users',
  'newsBoards',
  'portfolioAssets',
];

const SEGMENT_LABEL_KEY: Record<SearchSegment, string> = {
  all: 'search.segmentAll',
  coins: 'search.segmentCoins',
  news: 'search.segmentNews',
  users: 'search.segmentUsers',
  newsBoards: 'search.segmentNewsBoards',
  portfolioAssets: 'search.segmentPortfolio',
};

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
  onClose?: () => void;
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
  placeholder: placeholderProp,
  onClose,
}) => {
  const { t } = useTranslation();
  const placeholder = placeholderProp ?? t('search.placeholderDefault');
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildUnifiedSearchInputStyles(tokens), [tokens]);
  const c = tokens.colors;

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

  const visibleSegments = useMemo(
    () =>
      SEARCH_SEGMENT_ORDER.filter((id) => segments.includes(id)).map((id) => ({
        id,
        label: t(SEGMENT_LABEL_KEY[id]),
      })),
    [segments, t]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBarWrap}>
          <SearchBar
            value={localQuery}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            variant="embedded"
          />
        </View>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('search.closeSearch')}
          >
            <X size={18} color={c.neutral[700]} />
          </TouchableOpacity>
        ) : null}
      </View>

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
          {loading ? <ActivityIndicator size="small" color={c.primary[500]} /> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!loading && !error ? (
            <Text style={styles.metaText}>
              {t('search.resultCount', { count: resultCount, ms: tookMs })}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

function buildUnifiedSearchInputStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      backgroundColor: tokens.bg,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.md,
      paddingTop: s.xs,
      gap: s.sm,
    },
    searchBarWrap: {
      flex: 1,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: br.sm,
      backgroundColor: c.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentRow: {
      paddingHorizontal: s.md,
      gap: s.sm,
      paddingBottom: s.xs,
    },
    segmentChip: {
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      borderRadius: br.button,
      backgroundColor: c.neutral[100],
    },
    segmentChipActive: {
      backgroundColor: c.primary[500],
    },
    segmentText: {
      color: c.neutral[700],
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
    },
    segmentTextActive: {
      color: c.white,
    },
    statusRow: {
      minHeight: 24,
      paddingHorizontal: s.md,
      marginBottom: s.xs,
      justifyContent: 'center',
    },
    metaText: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
    },
    errorText: {
      color: c.error[600],
      fontSize: typo.fontSizes.xs,
    },
  });
}
