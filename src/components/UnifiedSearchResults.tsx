import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bookmark, Newspaper, User as UserIcon, Wallet } from 'lucide-react-native';
import { SearchSegment, UnifiedSearchResult } from '../services/api';
import { borderRadius, colors, spacing, typography } from '../theme/theme';

const AVATAR_SIZE = 36;

function ResultAvatar({
  type,
  logo,
  imageUrl,
  symbol,
}: {
  type: 'coin' | 'news' | 'user' | 'board' | 'asset';
  logo?: string;
  imageUrl?: string;
  symbol?: string;
}) {
  if (type === 'coin' && logo) {
    return (
      <Image source={{ uri: logo }} style={styles.avatar} resizeMode="cover" />
    );
  }
  if (type === 'news' && imageUrl) {
    return (
      <Image source={{ uri: imageUrl }} style={styles.avatar} resizeMode="cover" />
    );
  }
  const fallback = (
    <View style={[styles.avatarPlaceholder, type === 'news' && styles.avatarPlaceholderNews]}>
      {type === 'coin' || type === 'asset' ? (
        <Text style={styles.avatarPlaceholderText}>{symbol?.slice(0, 2)?.toUpperCase() || '?'}</Text>
      ) : type === 'news' ? (
        <Newspaper size={18} color={colors.neutral[500]} />
      ) : type === 'user' ? (
        <UserIcon size={18} color={colors.neutral[500]} />
      ) : type === 'board' ? (
        <Bookmark size={18} color={colors.neutral[500]} />
      ) : (
        <Wallet size={18} color={colors.neutral[500]} />
      )}
    </View>
  );
  return fallback;
}

type UnifiedSearchResultsProps = {
  result: UnifiedSearchResult;
  selectedSegment: SearchSegment;
  isActive: boolean;
  onCoinPress?: (coinId: string) => void;
  onNewsPress?: (newsId: string, url?: string) => void;
  onUserPress?: (userId: string) => void;
  renderUserAction?: (user: { id: string; username: string }) => React.ReactNode;
};

type RowData =
  | { key: string; type: 'group'; title: string }
  | { key: string; type: 'coin'; coinId: string; symbol: string; name: string; logo?: string }
  | { key: string; type: 'news'; newsId: string; title: string; source?: string; imageUrl?: string; url?: string }
  | { key: string; type: 'user'; userId: string; username: string }
  | { key: string; type: 'board'; boardId: string; name: string; itemCount: number }
  | { key: string; type: 'asset'; assetId: string; symbol: string; name: string; chain?: string };

function buildRows(result: UnifiedSearchResult, selectedSegment: SearchSegment): RowData[] {
  const coinRows = result.coins.map<RowData>((coin) => ({
    key: `coin-${coin.id}`,
    type: 'coin',
    coinId: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    logo: coin.logo,
  }));

  const newsRows = result.news.map<RowData>((news) => ({
    key: `news-${news.id}`,
    type: 'news',
    newsId: news.id,
    title: news.title,
    source: news.source,
    imageUrl: news.imageUrl,
    url: news.url ?? news.sourceUrl,
  }));

  const userRows = result.users.map<RowData>((user) => ({
    key: `user-${user.id}`,
    type: 'user',
    userId: user.id,
    username: user.username,
  }));

  const boardRows = result.newsBoards.map<RowData>((board) => ({
    key: `board-${board.id}`,
    type: 'board',
    boardId: board.id,
    name: board.name,
    itemCount: board.itemCount ?? board.newsIds?.length ?? 0,
  }));

  const assetRows = result.portfolioAssets.map<RowData>((asset) => ({
    key: `asset-${asset.id}`,
    type: 'asset',
    assetId: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    chain: asset.chain,
  }));

  if (selectedSegment === 'coins') return coinRows;
  if (selectedSegment === 'news') return newsRows;
  if (selectedSegment === 'users') return userRows;
  if (selectedSegment === 'newsBoards') return boardRows;
  if (selectedSegment === 'portfolioAssets') return assetRows;

  const rows: RowData[] = [];
  if (coinRows.length > 0) rows.push({ key: 'group-coins', type: 'group', title: 'Coins' }, ...coinRows);
  if (newsRows.length > 0) rows.push({ key: 'group-news', type: 'group', title: 'News' }, ...newsRows);
  if (userRows.length > 0) rows.push({ key: 'group-users', type: 'group', title: 'Users' }, ...userRows);
  if (boardRows.length > 0) rows.push({ key: 'group-boards', type: 'group', title: 'News Boards' }, ...boardRows);
  if (assetRows.length > 0) rows.push({ key: 'group-assets', type: 'group', title: 'Portfolio' }, ...assetRows);
  return rows;
}

export const UnifiedSearchResults: React.FC<UnifiedSearchResultsProps> = ({
  result,
  selectedSegment,
  isActive,
  onCoinPress,
  onNewsPress,
  onUserPress,
  renderUserAction,
}) => {
  const rows = React.useMemo(() => buildRows(result, selectedSegment), [result, selectedSegment]);

  if (!isActive) return null;

  return (
    <View style={styles.resultsWrap}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'group') {
            return <Text style={styles.groupTitle}>{item.title}</Text>;
          }

          if (item.type === 'coin') {
            return (
              <TouchableOpacity style={styles.row} onPress={() => onCoinPress?.(item.coinId)} activeOpacity={0.7}>
                <ResultAvatar type="coin" logo={item.logo} symbol={item.symbol} />
                <View style={styles.rowContent}>
                  <Text style={styles.primaryText}>{item.symbol}</Text>
                  <Text style={styles.secondaryText}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (item.type === 'news') {
            return (
              <TouchableOpacity style={styles.row} onPress={() => onNewsPress?.(item.newsId, item.url)} activeOpacity={0.7}>
                <ResultAvatar type="news" imageUrl={item.imageUrl} />
                <View style={styles.rowContent}>
                  <Text style={styles.primaryText} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.source}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (item.type === 'user') {
            return (
              <View style={styles.rowWithAction}>
                <TouchableOpacity style={styles.rowBody} onPress={() => onUserPress?.(item.userId)} activeOpacity={0.7}>
                  <ResultAvatar type="user" />
                  <View style={styles.rowContent}>
                    <Text style={styles.primaryText}>@{item.username}</Text>
                  </View>
                </TouchableOpacity>
                {renderUserAction ? renderUserAction({ id: item.userId, username: item.username }) : null}
              </View>
            );
          }

          if (item.type === 'board') {
            return (
              <View style={styles.row}>
                <ResultAvatar type="board" />
                <View style={styles.rowContent}>
                  <Text style={styles.primaryText}>{item.name}</Text>
                  <Text style={styles.secondaryText}>{item.itemCount} saved</Text>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.row}>
              <ResultAvatar type="asset" symbol={item.symbol} />
              <View style={styles.rowContent}>
                <Text style={styles.primaryText}>{item.symbol}</Text>
                <Text style={styles.secondaryText}>
                  {item.name}
                  {item.chain ? ` · ${item.chain}` : ''}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  resultsWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    flex: 1,
  },
  groupTitle: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    color: colors.neutral[500],
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderNews: {
    backgroundColor: colors.neutral[100],
  },
  avatarPlaceholderText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[600],
  },
  rowWithAction: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  primaryText: {
    color: colors.neutral[900],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  secondaryText: {
    color: colors.neutral[500],
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.neutral[500],
    fontSize: typography.fontSizes.sm,
  },
});
