import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FilterPills } from '../components/FilterPills';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { TrendingCoinCard } from '../components/TrendingCoinCard';
import { SearchBar } from '../components/SearchBar';
import { useAppStore } from '../state/useAppStore';
import { mockTrendingCoins, mockFeaturedNews } from '../mock/mockData';
import { ExploreCategory } from '../types';
import { colors } from '../theme/theme';

export const ExploreScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const exploreCategory = useAppStore((state) => state.exploreCategory);
  const setExploreCategory = useAppStore((state) => state.setExploreCategory);

  const categories: ExploreCategory[] = ['trending', 'top', 'nft', 'defi'];

  const filteredCoins = mockTrendingCoins.filter(
    (coin) =>
      exploreCategory === 'trending' ||
      coin.category === exploreCategory
  );

  const handleCoinPress = (coinId: string) => {
    console.log('Open coin detail:', coinId);
  };

  const handleNewsPress = (newsId: string) => {
    console.log('Open news detail:', newsId);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCoins}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrendingCoinCard coin={item} onPress={handleCoinPress} />
        )}
        ListHeaderComponent={
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search coins, tokens..."
            />
            <FeaturedCarousel items={mockFeaturedNews} onItemPress={handleNewsPress} />
            <FilterPills
              categories={categories}
              selectedCategory={exploreCategory}
              onSelect={setExploreCategory}
            />
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
});
