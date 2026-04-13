import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { SearchSegment } from '@/src/services/api';
import { UnifiedSearch } from '@/src/components/UnifiedSearch';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

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
  const c = tokens.colors;

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

  const handleCoinPress = React.useCallback(
    (coinId: string) => {
      router.push(`/coins/${coinId}` as never);
    },
    [router]
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('search.closeSearch')}
            activeOpacity={0.8}
          >
            <X size={18} color={c.neutral[700]} />
          </TouchableOpacity>
        </View>
        <UnifiedSearch
          query={query}
          onQueryChange={setQuery}
          selectedSegment={segment}
          onSegmentChange={setSegment}
          availableSegments={ALL_SEGMENTS}
          placeholder={t('search.placeholderAllSegments')}
          onCoinPress={handleCoinPress}
          onNewsPress={handleNewsPress}
        />
      </View>
    </SafeAreaView>
  );
}

function buildSearchScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    topBar: {
      alignItems: 'flex-end',
      paddingHorizontal: s.md,
      paddingTop: s.xs,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: br.sm,
      backgroundColor: c.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
