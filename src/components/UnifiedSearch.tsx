import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SearchSegment, UnifiedSearchResult } from '../services/api';
import { useUnifiedSearch } from '../hooks/useUnifiedSearch';
import { colors } from '../theme/theme';
import { DEFAULT_SEARCH_SEGMENTS, UnifiedSearchInput } from './UnifiedSearchInput';
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
  onCoinPress?: (coinId: string) => void;
  onNewsPress?: (newsId: string, url?: string) => void;
  onUserPress?: (userId: string) => void;
  renderUserAction?: (user: { id: string; username: string }) => React.ReactNode;
  onResult?: (result: UnifiedSearchResult) => void;
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
  placeholder = 'Search coins, news, users...',
  onCoinPress,
  onNewsPress,
  onUserPress,
  renderUserAction,
  onResult,
}) => {
  const segments = React.useMemo<SearchSegment[]>(() => {
    if (!availableSegments || availableSegments.length === 0) {
      return DEFAULT_SEARCH_SEGMENTS.map((item) => item.id);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
});
