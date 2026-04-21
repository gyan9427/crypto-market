import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MarketCapPlaceholder } from './MarketCapPlaceholder';

export const FeaturedMarketHeader: React.FC = () => (
  <View style={styles.wrapper}>
    <MarketCapPlaceholder />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
