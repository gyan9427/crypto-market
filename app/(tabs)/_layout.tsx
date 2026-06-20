import React, { useCallback, useEffect, useMemo } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, TrendingUp, Briefcase, User } from 'lucide-react-native';
import { TabBarMenuIcon } from '@/src/components/TabBarMenuIcon';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { PlatformPressable } from "expo-router/react-navigation";
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { QuickActionsProvider, useQuickActions } from '@/src/components/FAB';
import { CollapsibleNavHeader } from '@/src/components/CollapsibleNavHeader';
import { CollapsibleNavHeaderProvider } from '@/src/hooks/useCollapsibleNavHeader';
import { View, Image, StyleSheet, type ColorValue } from 'react-native';
import { useHasFeature, useFeaturesStore } from '@/src/utils/features';
import { useAuthStore } from '@/src/state/useAuthStore';
import { NotificationsGatewayHost } from '@/src/components/NotificationsGatewayHost';
import { PushNotificationsHost } from '@/src/components/PushNotificationsHost';

function DefaultCollapsibleHeader() {
  return <CollapsibleNavHeader />;
}

function MarketCollapsibleHeader() {
  return <CollapsibleNavHeader segment="all" />;
}

function ProfileCollapsibleHeader() {
  return <CollapsibleNavHeader segment="users" />;
}

function ProfileTabIcon({ color, size }: { color: ColorValue; size: number }) {
  const user = useAuthStore((s) => s.user);
  if (user?.avatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={[tabStyles.avatar, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, borderColor: color }]}
      />
    );
  }
  return <User size={size} color={color} />;
}

const tabStyles = StyleSheet.create({
  avatar: {
    borderWidth: 1.5,
  },
});

type QuickActionsTabButtonProps = Omit<BottomTabBarButtonProps, 'pressColor'> & {
  pressColor?: string;
};

function QuickActionsTabButton({ pressColor, ...props }: QuickActionsTabButtonProps) {
  const { t } = useTranslation();
  const { open } = useQuickActions();
  return (
    <PlatformPressable
      {...props}
      pressColor={pressColor}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={t('fab.addAction')}
    />
  );
}

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
        height: tokens.tabBarHeight,
        paddingRight: 0,
      },
      tabBarItemStyle: {
        flex: 1,
      },
      tabBarLabelStyle: {
        fontSize: tokens.typography.fontSizes.badge,
        fontWeight: tokens.typography.fontWeights.semibold,
        letterSpacing: tokens.typography.letterSpacing.tabLabel,
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

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
        'portfolio/index': t('nav.portfolio'),
        'portfolio/intelligence': 'Portfolio Intelligence',
        'search/index': t('nav.search'),
        rewards: t('nav.rewards'),
        notifications: 'Notifications',
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
      {isAuthenticated ? <NotificationsGatewayHost /> : null}
      {isAuthenticated ? <PushNotificationsHost /> : null}
      <QuickActionsProvider>
      <CollapsibleNavHeaderProvider>
      <Tabs screenOptions={mergedScreenOptions as never}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            header: DefaultCollapsibleHeader,
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            href: hasNewsFeed ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: t('nav.portfolio'),
            header: DefaultCollapsibleHeader,
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
            href: hasPortfolioTracking ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: t('nav.market'),
            header: MarketCollapsibleHeader,
            tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
            href: hasMarketData ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            header: ProfileCollapsibleHeader,
            tabBarIcon: ({ color, size }) => <ProfileTabIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: t('nav.menu'),
            tabBarIcon: ({ color, size }) => <TabBarMenuIcon color={color} size={size} />,
            tabBarButton: ({ pressColor, ...props }) => (
              <QuickActionsTabButton
                {...props}
                pressColor={typeof pressColor === 'string' ? pressColor : undefined}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
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
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="portfolio/intelligence"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="portfolio/composition"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
      </CollapsibleNavHeaderProvider>
      </QuickActionsProvider>
    </View>
  );
}
