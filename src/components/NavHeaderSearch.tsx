import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '@/src/components/SearchBar';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface NavHeaderSearchProps {
  segment?: string;
  placeholder?: string;
}

const DEFAULT_SEGMENT = 'all';
const HEADER_LOGO_SIZE = 40;

export function NavHeaderSearch({ segment = DEFAULT_SEGMENT, placeholder }: NavHeaderSearchProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  const openSearch = () => {
    router.push(`/search?segment=${encodeURIComponent(segment)}` as never);
  };

  return (
    <View style={[styles.container, { width: screenWidth, backgroundColor: tokens.headerBg }]}>
      <View style={styles.logoSlot}>
        <Image
          source={require('../../assets/images/android-chrome.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel={t('nav.appName')}
        />
      </View>
      <View style={styles.searchSlot}>
        <SearchBar
          variant="header"
          value=""
          onChangeText={() => {}}
          editable={false}
          onPress={openSearch}
          placeholder={placeholder ?? t('search.placeholderShort')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 18,
    paddingVertical: 6,
    gap: 10,
  },
  logoSlot: {
    width: '8%',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    width: HEADER_LOGO_SIZE,
    height: HEADER_LOGO_SIZE,
  },
  searchSlot: {
    width: '92%',
  },
});
