import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, Bell } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/state/useAuthStore';

export interface NavHeaderSearchProps {
  segment?: string;
  placeholder?: string;
}

const DEFAULT_SEGMENT = 'all';

export function NavHeaderSearch({ segment = DEFAULT_SEGMENT }: NavHeaderSearchProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens, effectiveScheme } = useAppTheme();
  const user = useAuthStore((s) => s.user);

  const logoSource =
    effectiveScheme === 'dark'
      ? require('../../assets/images/logo_cropped.png')
      : require('../../assets/images/logo_dark_cropped.png');

  const openSearch = () => {
    router.push(`/search?segment=${encodeURIComponent(segment)}` as never);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? user?.username?.charAt(0)?.toUpperCase() ?? 'N';

  return (
    <View style={[styles.container, { backgroundColor: tokens.headerBg }]}>
      <Image
        source={logoSource}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel={t('nav.appName')}
      />
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={openSearch}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={t('search.placeholderShort')}
        >
          <Search size={22} color={tokens.text} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={22} color={tokens.text} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: tokens.colors.primary[500] }]}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Text style={[styles.avatarText, { color: tokens.colors.white }]}>{initial}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    width: 120,
    height: 36,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
