import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchSegment } from '@/src/services/api';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';
import { UnifiedSearch } from '@/src/components/UnifiedSearch';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { navigateToCoin } from '@/src/navigation/coinNavigation';

const ALL_SEGMENTS: SearchSegment[] = [
  'all',
  'coins',
  'news',
  'users',
  'newsBoards',
  'portfolioAssets',
];

const normalizeSegment = (value: unknown): SearchSegment => {
  const segment = String(value || 'all') as SearchSegment;
  return ALL_SEGMENTS.includes(segment) ? segment : 'all';
};

export default function SearchScreen() {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildSearchScreenStyles(tokens), [tokens]);

  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; segment?: string }>();

  const [query, setQuery] = React.useState(String(params.query || ''));
  const [segment, setSegment] = React.useState<SearchSegment>(normalizeSegment(params.segment));

  const prevQueryParamRef = React.useRef(params.query);
  React.useEffect(() => {
    const queryParam = String(params.query || '');
    if (prevQueryParamRef.current !== queryParam) {
      prevQueryParamRef.current = queryParam;
      setQuery(queryParam);
    }
  }, [params.query]);

  const prevSegmentParamRef = React.useRef(normalizeSegment(params.segment));
  React.useEffect(() => {
    const segmentParam = normalizeSegment(params.segment);
    if (prevSegmentParamRef.current !== segmentParam) {
      prevSegmentParamRef.current = segmentParam;
      setSegment(segmentParam);
    }
  }, [params.segment]);

  const recordSearchCoin = useFeedIntentStore((s) => s.recordSearchCoin);

  const handleCoinPress = React.useCallback(
    (coinId: string, symbol?: string) => {
      if (symbol) recordSearchCoin(symbol);
      navigateToCoin(router, coinId, 'search');
    },
    [router, recordSearchCoin]
  );

  const handleNewsPress = React.useCallback(
    (_newsId: string, url?: string) => {
      if (url) {
        WebBrowser.openBrowserAsync(url);
      }
    },
    []
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <UnifiedSearch
          query={query}
          onQueryChange={setQuery}
          selectedSegment={segment}
          onSegmentChange={setSegment}
          availableSegments={ALL_SEGMENTS}
          placeholder={t('search.placeholderAllSegments')}
          onCoinPress={handleCoinPress}
          onNewsPress={handleNewsPress}
          onClose={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

function buildSearchScreenStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
  });
}
