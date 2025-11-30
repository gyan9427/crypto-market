import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SegmentToggle } from '../components/SegmentToggle';
import { SearchBar } from '../components/SearchBar';
import { NewsCard } from '../components/NewsCard';
import { useAppStore } from '../state/useAppStore';
import { mockNews } from '../mock/mockData';
import { colors } from '../theme/theme';

export const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const feedFilter = useAppStore((state) => state.feedFilter);
  const setFeedFilter = useAppStore((state) => state.setFeedFilter);
  const toggleLike = useAppStore((state) => state.toggleLike);
  const toggleSave = useAppStore((state) => state.toggleSave);
  const likedNews = useAppStore((state) => state.likedNews);
  const savedNews = useAppStore((state) => state.savedNews);

  const newsData = mockNews.map((item) => ({
    ...item,
    isLiked: likedNews.includes(item.id),
    isSaved: savedNews.includes(item.id),
  }));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSegmentChange = (index: number) => {
    setFeedFilter(index === 0 ? 'following' : 'explore');
  };

  const handleLike = (newsId: string) => {
    toggleLike(newsId);
  };

  const handleSave = (newsId: string) => {
    toggleSave(newsId);
  };

  const handleComment = (newsId: string) => {
    console.log('Comment on:', newsId);
  };

  const handleShare = (newsId: string) => {
    console.log('Share:', newsId);
  };

  const handleNewsPress = (newsId: string) => {
    console.log('Open news detail:', newsId);
  };

  const handleCoinPress = (coinId: string) => {
    console.log('Open coin detail:', coinId);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={newsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onSave={handleSave}
            onPress={handleNewsPress}
            onCoinPress={handleCoinPress}
          />
        )}
        ListHeaderComponent={
          <>
            <SegmentToggle
              options={['Following', 'Explore']}
              selectedIndex={feedFilter === 'following' ? 0 : 1}
              onSelect={handleSegmentChange}
            />
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search news, coins..."
            />
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  },
});
