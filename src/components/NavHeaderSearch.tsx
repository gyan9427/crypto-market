import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchBar } from './SearchBar';

export interface NavHeaderSearchProps {
  /** Unified search segment query param (must match SearchSegment on `/search`). */
  segment?: string;
  placeholder?: string;
}

const DEFAULT_SEGMENT = 'all';
const DEFAULT_PLACEHOLDER = 'Search news, coins...';

/**
 * Single nav-header affordance: opens full-screen unified search with the given segment.
 */
export function NavHeaderSearch({
  segment = DEFAULT_SEGMENT,
  placeholder = DEFAULT_PLACEHOLDER,
}: NavHeaderSearchProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <SearchBar
        value=""
        onChangeText={() => {}}
        editable={false}
        onPress={() =>
          router.push(`/search?segment=${encodeURIComponent(segment)}` as never)
        }
        placeholder={placeholder}
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
