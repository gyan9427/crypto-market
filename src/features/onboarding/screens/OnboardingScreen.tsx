import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SlideOne } from './SlideOne';
import { SlideTwo } from './SlideTwo';
import { SlideThree } from './SlideThree';
import { PaginationDots } from '../components/PaginationDots';
import { NextButton } from '../components/NextButton';
import { useOnboarding } from '../hooks/useOnboarding';
import { ONBOARDING_SLIDES } from '../constants/onboardingData';

const SLIDE_COUNT = ONBOARDING_SLIDES.length;

export function OnboardingScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tokens, effectiveScheme } = useAppTheme();
  const styles = useMemo(() => buildOnboardingScreenStyles(tokens), [tokens]);
  const isDark = effectiveScheme === 'dark';
  const bg = tokens.bg;
  const skipColor = tokens.textMuted;

  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const {
    completeOnboarding,
    skipOnboarding,
    trackScreenView,
    trackSlideChanged,
    trackNextPressed,
  } = useOnboarding();

  const illustrationWidth = Math.min(windowWidth - tokens.spacing.lg * 2, 360);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    trackScreenView(0);
  }, [trackScreenView]);

  const applyIndex = useCallback(
    (next: number, prev: number) => {
      if (next === prev || next < 0 || next >= SLIDE_COUNT) return;
      trackSlideChanged(prev, next);
      trackScreenView(next);
      setIndex(next);
      indexRef.current = next;
    },
    [trackScreenView, trackSlideChanged]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = e.nativeEvent.contentOffset.x;
      const next = Math.round(w / windowWidth);
      const prev = indexRef.current;
      applyIndex(next, prev);
    },
    [applyIndex, windowWidth]
  );

  const goNext = useCallback(() => {
    const current = indexRef.current;
    const isLast = current >= SLIDE_COUNT - 1;
    trackNextPressed(current, isLast);
    if (isLast) {
      void completeOnboarding(current);
      return;
    }
    const next = current + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
  }, [completeOnboarding, trackNextPressed]);

  const onSkip = useCallback(() => {
    void skipOnboarding(indexRef.current);
  }, [skipOnboarding]);

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <View style={[styles.slide, { width: windowWidth }]}>
        {item === 0 && <SlideOne illustrationWidth={illustrationWidth} />}
        {item === 1 && <SlideTwo illustrationWidth={illustrationWidth} />}
        {item === 2 && <SlideThree illustrationWidth={illustrationWidth} />}
      </View>
    ),
    [illustrationWidth, windowWidth]
  );

  const keyExtractor = useCallback((i: number) => String(i), []);

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({
      length: windowWidth,
      offset: windowWidth * i,
      index: i,
    }),
    [windowWidth]
  );

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { paddingRight: tokens.spacing.md + insets.right }]}>
        <Pressable onPress={onSkip} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={[styles.skip, { color: skipColor }]}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        ref={flatListRef}
        data={[0, 1, 2]}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 100);
        }}
        initialNumToRender={SLIDE_COUNT}
        windowSize={3}
        removeClippedSubviews
        decelerationRate="fast"
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + tokens.spacing.lg }]}>
        <PaginationDots count={SLIDE_COUNT} activeIndex={index} />
        <NextButton
          label={index >= SLIDE_COUNT - 1 ? 'Get Started' : 'Next'}
          onPress={goNext}
        />
      </View>
    </View>
  );
}

function buildOnboardingScreenStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  const typo = tokens.typography;
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingVertical: s.sm,
      minHeight: 44,
    },
    skip: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
    },
    slide: {
      flex: 1,
      paddingTop: s.md,
    },
    footer: {
      paddingHorizontal: s.lg,
      alignItems: 'center',
    },
  });
}
