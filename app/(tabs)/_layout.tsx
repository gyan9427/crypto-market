import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, TrendingUp, Briefcase, User } from 'lucide-react-native';
import { colors, spacing, typography } from '@/src/theme/theme';
import { FAB } from '@/src/components/FAB';
import { View } from 'react-native';
import { hasFeature } from '@/src/utils/features';

const formatSegmentTitle = (rawSegment: string) => {
  return rawSegment
    .replace(/[\[\]]/g, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getHeaderTitle = (routeName: string, params?: Record<string, unknown>) => {
  if (routeName === 'index') return 'NAYFT';

  if (routeName === 'news-boards/[boardId]') {
    const boardName = params?.name;
    return typeof boardName === 'string' && boardName.trim().length > 0 ? boardName : 'News Board';
  }

  const routeTitleMap: Record<string, string> = {
    portfolio: 'Portfolio',
    market: 'Market',
    profile: 'Profile',
    'search/index': 'Search',
    rewards: 'Rewards',
    'coin/[coinId]': 'Coin',
    'coins/[coinId]': 'Coin',
    'news-boards/index': 'News Boards',
  };

  if (routeTitleMap[routeName]) return routeTitleMap[routeName];

  const segments = routeName.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? routeName;
  return formatSegmentTitle(lastSegment) || 'NAYFT';
};

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.neutral[400],
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.neutral[200],
            paddingBottom: spacing.sm,
            paddingTop: spacing.sm,
            height: 70,
            paddingRight: 0,
          },
          tabBarItemStyle: {
            flex: 1,
          },
          tabBarLabelStyle: {
            fontSize: typography.fontSizes.xs,
            fontWeight: typography.fontWeights.semibold,
          },
          headerShown: true,
          headerTitle: getHeaderTitle(route.name, route.params as Record<string, unknown> | undefined),
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.neutral[900],
          headerTitleStyle: {
            fontSize: typography.fontSizes.lg,
            fontWeight: typography.fontWeights.semibold,
          },
          headerShadowVisible: true,
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portfolio',
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
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
            title: 'Market',
            tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            href: hasFeature('rewards') ? undefined : null,
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
