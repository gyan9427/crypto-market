import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Bell } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface NavHeaderSearchProps {
  segment?: string;
  placeholder?: string;
}

const DEFAULT_SEGMENT = 'all';

export function NavHeaderSearch({ segment = DEFAULT_SEGMENT }: NavHeaderSearchProps) {
  const router = useRouter();
  const { tokens, effectiveScheme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  const logoSource =
    effectiveScheme === 'dark'
      ? require('../../assets/images/logo.png')
      : require('../../assets/images/logo_dark.png');

  return (
    <View style={[styles.container, { width: screenWidth }]}>
      <TouchableOpacity
        onPress={() => router.push(`/search?segment=${encodeURIComponent(segment)}` as never)}
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 16 }}
        activeOpacity={0.7}
      >
        <Search size={28} color={tokens.text} strokeWidth={2} />
      </TouchableOpacity>

      <Image source={logoSource} style={styles.logo} resizeMode="contain" />

      <TouchableOpacity
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 16, right: 8 }}
        activeOpacity={0.7}
      >
        <Bell size={28} color={tokens.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    padding: 4,
  },
  logo: {
    height: 120,
    width: 300,
  },
});
