import React, { useCallback, useEffect, useMemo } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, TrendingUp, Briefcase, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { FAB } from '@/src/components/FAB';
import { NavHeaderSearch } from '@/src/components/NavHeaderSearch';
import { View } from 'react-native';
import { useHasFeature, useFeaturesStore } from '@/src/utils/features';

const formatSegmentTitle = (rawSegment: string) => {
  return rawSegment
    .replace(/[\[\]]/g, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const hasNewsFeed = useHasFeature('news_feed');
  const hasPortfolioTracking = useHasFeature('portfolio_tracking');
  const hasMarketData = useHasFeature('market_data');

  const screenOptions = useCallback(
    () => ({
      tabBarActiveTintColor: tokens.text,
      tabBarInactiveTintColor: tokens.textMuted,
      tabBarStyle: {
        backgroundColor: tokens.tabBarBg,
        borderTopWidth: 0.5,
        borderTopColor: tokens.tabBarBorder,
        paddingBottom: tokens.spacing.sm,
        paddingTop: tokens.spacing.xs,
        height: 68,
        paddingRight: 0,
      },
      tabBarItemStyle: {
        flex: 1,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600' as const,
        letterSpacing: 0.08,
        textTransform: 'uppercase' as const,
        fontFamily: tokens.typography.fontFamilies.sansSemiBold,
      },
      headerShown: true,
      headerStyle: {
        backgroundColor: tokens.headerBg,
      },
      headerTintColor: tokens.text,
      headerTitleStyle: {
        fontSize: tokens.typography.fontSizes.md,
        fontWeight: tokens.typography.fontWeights.semibold,
        fontFamily: tokens.typography.fontFamilies.sansSemiBold,
        letterSpacing: -0.4,
      },
      headerShadowVisible: false,
      headerBorderBottomColor: tokens.headerBorder,
    }),
    [tokens]
  );

  useEffect(() => {
    useFeaturesStore.getState().refetchFeatures();
  }, []);

  const getHeaderTitle = useCallback(
    (routeName: string, params?: Record<string, unknown>) => {
      if (routeName === 'index' || routeName === 'market' || routeName === 'profile') return '';

      if (routeName === 'news-boards/[boardId]') {
        const boardName = params?.name;
        return typeof boardName === 'string' && boardName.trim().length > 0
          ? boardName
          : t('nav.newsBoardFallback');
      }

      const routeTitleMap: Record<string, string> = {
        portfolio: t('nav.portfolio'),
        'search/index': t('nav.search'),
        rewards: t('nav.rewards'),
        'coin/[coinId]': t('nav.coin'),
        'coins/[coinId]': t('nav.coin'),
        'news-boards/index': t('nav.newsBoards'),
      };

      if (routeTitleMap[routeName]) return routeTitleMap[routeName];

      const segments = routeName.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1] ?? routeName;
      return formatSegmentTitle(lastSegment) || t('nav.appName');
    },
    [t]
  );

  useEffect(() => {
    const tab = segments[0] as string | undefined;
    if (!tab) return;
    const fallback = hasNewsFeed ? '/(tabs)' : hasMarketData ? '/(tabs)/market' : '/(tabs)/profile';
    if (tab === 'portfolio' && !hasPortfolioTracking) router.replace(fallback as any);
    else if (tab === 'index' && !hasNewsFeed) router.replace(hasMarketData ? '/(tabs)/market' : '/(tabs)/profile');
    else if (tab === 'market' && !hasMarketData) router.replace(hasNewsFeed ? '/(tabs)' : '/(tabs)/profile');
  }, [segments, hasPortfolioTracking, hasNewsFeed, hasMarketData, router]);

  const mergedScreenOptions = useMemo(
    () =>
      ({ route }: { route: { name: string; params?: object } }) => ({
        ...screenOptions(),
        headerTitle: getHeaderTitle(route.name, route.params as Record<string, unknown> | undefined),
      }),
    [screenOptions, getHeaderTitle]
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <Tabs screenOptions={mergedScreenOptions as never}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            headerTitle: () => <NavHeaderSearch />,
            headerTitleAlign: 'left',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            href: hasNewsFeed ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: t('nav.portfolio'),
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
            href: hasPortfolioTracking ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: () => <View style={{ flex: 1 }} />,
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: t('nav.market'),
            headerTitle: () => (
              <NavHeaderSearch
                segment="all"
                placeholder={t('search.placeholderMarket')}
              />
            ),
            headerTitleAlign: 'left',
            tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
            href: hasMarketData ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            headerTitle: () => (
              <NavHeaderSearch segment="users" placeholder={t('search.placeholderUsers')} />
            ),
            headerTitleAlign: 'left',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="coin/[coinId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="coins/[coinId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="news-boards/index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="news-boards/[boardId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="search/index"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <FAB />
    </View>
  );
}
