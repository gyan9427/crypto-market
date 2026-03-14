import React from 'react';
import { Tabs } from 'expo-router';
import { Home, TrendingUp, Briefcase, User } from 'lucide-react-native';
import { colors, spacing, typography } from '@/src/theme/theme';
import { FAB } from '@/src/components/FAB';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
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
          headerShown: false,
        }}
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
      </Tabs>
      <FAB />
    </View>
  );
}
