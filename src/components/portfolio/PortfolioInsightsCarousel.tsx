import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import { useCollapsibleNavHeader } from '@/src/hooks/useCollapsibleNavHeader';
import {
  NESTED_HORIZONTAL_LIST_PROPS,
  useHorizontalScrollInteractionHandlers,
} from '@/src/hooks/useHorizontalScrollInteractionHandlers';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { PORTFOLIO_INSIGHT_CAROUSEL_CARD_HEIGHT } from '@/src/components/portfolio-intelligence/piStyles';
import { getMarketUiPalette } from '@/src/theme/chartPalette';
import { PortfolioCompositionSummaryCard } from '@/src/components/portfolio/PortfolioCompositionSummaryCard';
import { PortfolioIntelligenceSummaryCard } from '@/src/components/portfolio-intelligence/PortfolioIntelligenceSummaryCard';
import type { Holdings, WalletAddress, ExchangeConnection } from '@/src/types';
import type { PortfolioAccountSelection } from '@/src/utils/portfolioAccountFilter';
import type { PortfolioSummaryDto, PiInsight } from '@/src/services/portfolioIntelligenceApi';

const PAGE_HORIZONTAL_PADDING = 16;

type CarouselPage =
  | { key: 'composition'; kind: 'composition' }
  | { key: 'intelligence'; kind: 'intelligence' };

interface PortfolioInsightsCarouselProps {
  holdings: Holdings | null;
  holdingsLoading?: boolean;
  selectedAccount: PortfolioAccountSelection;
  wallets: WalletAddress[];
  exchanges: ExchangeConnection[];
  showIntelligence: boolean;
  piSummary: PortfolioSummaryDto | null;
  topPiInsight: PiInsight | null;
  piLoading?: boolean;
  onPressViewComposition: () => void;
  onPressViewIntelligence: () => void;
}

export const PortfolioInsightsCarousel: React.FC<PortfolioInsightsCarouselProps> = ({
  holdings,
  holdingsLoading,
  selectedAccount,
  wallets,
  exchanges,
  showIntelligence,
  piSummary,
  topPiInsight,
  piLoading,
  onPressViewComposition,
  onPressViewIntelligence,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const { headerScrollFrozen } = useCollapsibleNavHeader();
  const listRef = useRef<FlatList<CarouselPage>>(null);
  const [activePage, setActivePage] = useState(0);
  const activePageRef = useRef(0);

  const pageWidth = Dimensions.get('window').width;

  const pages = useMemo<CarouselPage[]>(() => {
    const items: CarouselPage[] = [{ key: 'composition', kind: 'composition' }];
    if (showIntelligence) {
      items.push({ key: 'intelligence', kind: 'intelligence' });
    }
    return items;
  }, [showIntelligence]);

  const syncActivePage = useCallback(
    (offsetX: number) => {
      const index = Math.max(0, Math.min(pages.length - 1, Math.round(offsetX / pageWidth)));
      if (index === activePageRef.current) return;
      activePageRef.current = index;
      setActivePage(index);
    },
    [pageWidth, pages.length]
  );

  const handleScrollInteraction = useCallback(
    (active: boolean) => {
      headerScrollFrozen.value = active ? 1 : 0;
    },
    [headerScrollFrozen]
  );

  const { touchInteractionHandlers, scrollInteractionHandlers } =
    useHorizontalScrollInteractionHandlers(handleScrollInteraction);

  const onCarouselScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncActivePage(event.nativeEvent.contentOffset.x);
    },
    [syncActivePage]
  );

  const goToPage = useCallback((index: number) => {
    activePageRef.current = index;
    setActivePage(index);
    listRef.current?.scrollToOffset({ offset: index * pageWidth, animated: true });
  }, [pageWidth]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<CarouselPage> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth]
  );

  const renderItem = useCallback(
    ({ item }: { item: CarouselPage }) => (
      <View style={[styles.page, { width: pageWidth }]}>
        {item.kind === 'composition' ? (
          <PortfolioCompositionSummaryCard
            holdings={holdings}
            selectedAccount={selectedAccount}
            wallets={wallets}
            exchanges={exchanges}
            loading={holdingsLoading}
            onPressViewComposition={onPressViewComposition}
            embedded
          />
        ) : (
          <PortfolioIntelligenceSummaryCard
            summary={piSummary}
            topInsight={topPiInsight}
            loading={piLoading}
            onPressViewIntelligence={onPressViewIntelligence}
            embedded
          />
        )}
      </View>
    ),
    [
      styles.page,
      pageWidth,
      holdings,
      selectedAccount,
      wallets,
      exchanges,
      holdingsLoading,
      onPressViewComposition,
      piSummary,
      topPiInsight,
      piLoading,
      onPressViewIntelligence,
    ]
  );

  if (pages.length === 0) return null;

  if (pages.length === 1) {
    return (
      <PortfolioCompositionSummaryCard
        holdings={holdings}
        selectedAccount={selectedAccount}
        wallets={wallets}
        exchanges={exchanges}
        loading={holdingsLoading}
        onPressViewComposition={onPressViewComposition}
      />
    );
  }

  return (
    <View style={styles.wrap} {...touchInteractionHandlers}>
      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={pageWidth}
        snapToAlignment="start"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={getItemLayout}
        {...NESTED_HORIZONTAL_LIST_PROPS}
        {...scrollInteractionHandlers}
        onScroll={onCarouselScroll}
        onScrollEndDrag={onCarouselScroll}
        onMomentumScrollEnd={(e) => {
          scrollInteractionHandlers.onMomentumScrollEnd();
          onCarouselScroll(e);
        }}
      />
      <View style={styles.dotsRow}>
        {pages.map((page, index) => {
          const isActive = index === activePage;
          return (
            <Pressable
              key={page.key}
              onPress={() => goToPage(index)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={page.kind === 'composition' ? 'Portfolio composition' : 'Portfolio intelligence'}
              hitSlop={8}
            >
              <View style={[styles.dot, isActive && styles.dotActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const ui = getMarketUiPalette(tokens);
  return StyleSheet.create({
    wrap: {
      paddingTop: 8,
    },
    page: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      minHeight: PORTFOLIO_INSIGHT_CAROUSEL_CARD_HEIGHT,
      overflow: 'visible',
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      marginBottom: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: ui.dotInactive,
    },
    dotActive: {
      width: 18,
      height: 6,
      borderRadius: 3,
      backgroundColor: ui.accent,
    },
  });
}
