import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchBar } from './SearchBar';

/**
 * Home tab stack header: full-width search affordance that navigates to search screen.
 */
export function HomeHeaderSearch() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <SearchBar
        value=""
        onChangeText={() => {}}
        editable={false}
        onPress={() => router.push('/search?segment=all' as never)}
        placeholder="Search news, coins..."
        variant="header"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
});
