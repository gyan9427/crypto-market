import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SearchSegment, UnifiedSearchResult } from '../services/api';
import { useUnifiedSearch } from '../hooks/useUnifiedSearch';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SEARCH_SEGMENT_ORDER, UnifiedSearchInput } from './UnifiedSearchInput';
import { UnifiedSearchResults } from './UnifiedSearchResults';

type UnifiedSearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedSegment: SearchSegment;
  onSegmentChange: (segment: SearchSegment) => void;
  availableSegments?: SearchSegment[];
  minQueryLength?: number;
  limit?: number;
  placeholder?: string;
  onCoinPress?: (coinId: string, symbol?: string) => void;
  onNewsPress?: (newsId: string, url?: string) => void;
  onUserPress?: (userId: string) => void;
  renderUserAction?: (user: { id: string; username: string }) => React.ReactNode;
  onResult?: (result: UnifiedSearchResult) => void;
  onClose?: () => void;
};

function segmentCount(result: UnifiedSearchResult, segment: SearchSegment): number {
  if (segment === 'all') {
    return (
      result.coins.length +
      result.news.length +
      result.users.length +
      result.newsBoards.length +
      result.portfolioAssets.length
    );
  }
  if (segment === 'coins') return result.coins.length;
  if (segment === 'news') return result.news.length;
  if (segment === 'users') return result.users.length;
  if (segment === 'newsBoards') return result.newsBoards.length;
  return result.portfolioAssets.length;
}

export const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  query,
  onQueryChange,
  selectedSegment,
  onSegmentChange,
  availableSegments,
  minQueryLength = 2,
  limit = 8,
  placeholder: placeholderProp,
  onCoinPress,
  onNewsPress,
  onUserPress,
  renderUserAction,
  onResult,
  onClose,
}) => {
  const { t } = useTranslation();
  const placeholder = placeholderProp ?? t('search.placeholderDefault');
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: tokens.bg,
        },
      }),
    [tokens]
  );
  const segments = React.useMemo<SearchSegment[]>(() => {
    if (!availableSegments || availableSegments.length === 0) {
      return [...SEARCH_SEGMENT_ORDER];
    }
    return availableSegments;
  }, [availableSegments]);

  const { result, loading, error, isActive } = useUnifiedSearch(query, {
    segments,
    minQueryLength,
    limit,
    enabled: true,
  });

  React.useEffect(() => {
    onResult?.(result);
  }, [onResult, result]);

  const selectedCount = segmentCount(result, selectedSegment);

  return (
    <View style={styles.container}>
      <UnifiedSearchInput
        query={query}
        onQueryChange={onQueryChange}
        selectedSegment={selectedSegment}
        onSegmentChange={onSegmentChange}
        segments={segments}
        loading={loading}
        error={error}
        resultCount={selectedCount}
        tookMs={result.meta.tookMs}
        isActive={isActive}
        placeholder={placeholder}
        onClose={onClose}
      />
      <UnifiedSearchResults
        result={result}
        selectedSegment={selectedSegment}
        isActive={isActive}
        onCoinPress={onCoinPress}
        onNewsPress={onNewsPress}
        onUserPress={onUserPress}
        renderUserAction={renderUserAction}
      />
    </View>
  );
};

