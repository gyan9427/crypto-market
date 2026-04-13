import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Bookmark, Newspaper, User as UserIcon, Wallet } from 'lucide-react-native';
import { SearchSegment, SearchSegmentKey, UnifiedSearchResult } from '../services/api';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const AVATAR_SIZE = 36;

type UnifiedStyles = ReturnType<typeof buildUnifiedSearchResultsStyles>;

function ResultAvatar({
  type,
  logo,
  imageUrl,
  symbol,
  styles,
  iconMuted,
}: {
  type: 'coin' | 'news' | 'user' | 'board' | 'asset';
  logo?: string;
  imageUrl?: string;
  symbol?: string;
  styles: UnifiedStyles;
  iconMuted: string;
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
        <Newspaper size={18} color={iconMuted} />
      ) : type === 'user' ? (
        <UserIcon size={18} color={iconMuted} />
      ) : type === 'board' ? (
        <Bookmark size={18} color={iconMuted} />
      ) : (
        <Wallet size={18} color={iconMuted} />
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

function buildRows(
  result: UnifiedSearchResult,
  selectedSegment: SearchSegment,
  t: TFunction
): RowData[] {
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
  if (coinRows.length > 0) rows.push({ key: 'group-coins', type: 'group', title: t('search.segmentCoins') }, ...coinRows);
  if (newsRows.length > 0) rows.push({ key: 'group-news', type: 'group', title: t('search.segmentNews') }, ...newsRows);
  if (userRows.length > 0) rows.push({ key: 'group-users', type: 'group', title: t('search.segmentUsers') }, ...userRows);
  if (boardRows.length > 0)
    rows.push({ key: 'group-boards', type: 'group', title: t('search.segmentNewsBoards') }, ...boardRows);
  if (assetRows.length > 0)
    rows.push({ key: 'group-assets', type: 'group', title: t('search.segmentPortfolio') }, ...assetRows);
  return rows;
}

function emptyStateMessage(
  result: UnifiedSearchResult,
  selectedSegment: SearchSegment,
  t: TFunction
): string {
  if (selectedSegment === 'all' && result.meta.degraded) {
    return t('search.emptyTryAgain');
  }
  if (selectedSegment !== 'all') {
    const st = result.meta.segmentStatus?.[selectedSegment as SearchSegmentKey];
    if (st === 'timeout') return t('search.emptySectionTimeout');
    if (st === 'error') return t('search.emptySectionError');
  }
  return t('home.noResults');
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
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildUnifiedSearchResultsStyles(tokens), [tokens]);
  const c = tokens.colors;
  const iconMuted = c.neutral[500];

  const rows = React.useMemo(() => buildRows(result, selectedSegment, t), [result, selectedSegment, t]);
  const showDegradedBanner =
    Boolean(result.meta.degraded) && selectedSegment === 'all' && rows.length > 0;

  if (!isActive) return null;

  return (
    <View style={styles.resultsWrap}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          showDegradedBanner ? (
            <View style={styles.degradedBanner}>
              <Text style={styles.degradedText}>{t('search.degradedPartial')}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{emptyStateMessage(result, selectedSegment, t)}</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'group') {
            return <Text style={styles.groupTitle}>{item.title}</Text>;
          }

          if (item.type === 'coin') {
            return (
              <TouchableOpacity style={styles.row} onPress={() => onCoinPress?.(item.coinId)} activeOpacity={0.7}>
                <ResultAvatar type="coin" logo={item.logo} symbol={item.symbol} styles={styles} iconMuted={iconMuted} />
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
                <ResultAvatar type="news" imageUrl={item.imageUrl} styles={styles} iconMuted={iconMuted} />
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
                  <ResultAvatar type="user" styles={styles} iconMuted={iconMuted} />
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
                <ResultAvatar type="board" styles={styles} iconMuted={iconMuted} />
                <View style={styles.rowContent}>
                  <Text style={styles.primaryText}>{item.name}</Text>
                  <Text style={styles.secondaryText}>{t('search.boardSavedCount', { count: item.itemCount })}</Text>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.row}>
              <ResultAvatar type="asset" symbol={item.symbol} styles={styles} iconMuted={iconMuted} />
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

function buildUnifiedSearchResultsStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  return StyleSheet.create({
    degradedBanner: {
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      backgroundColor: c.neutral[100],
      borderBottomWidth: 1,
      borderBottomColor: c.neutral[200],
    },
    degradedText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[600],
    },
    resultsWrap: {
      marginHorizontal: s.md,
      marginBottom: s.sm,
      borderRadius: br.md,
      backgroundColor: tokens.surface,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      flex: 1,
    },
    groupTitle: {
      paddingHorizontal: s.md,
      paddingTop: s.md,
      paddingBottom: s.xs,
      color: tokens.textMuted,
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      borderTopWidth: 1,
      borderTopColor: c.neutral[100],
    },
    rowContent: {
      flex: 1,
      marginLeft: s.sm,
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
      backgroundColor: c.primary[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholderNews: {
      backgroundColor: c.neutral[100],
    },
    avatarPlaceholderText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.bold,
      color: c.primary[600],
    },
    rowWithAction: {
      borderTopWidth: 1,
      borderTopColor: c.neutral[100],
      paddingHorizontal: s.md,
      paddingVertical: s.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: s.xs,
      paddingRight: s.md,
    },
    primaryText: {
      color: tokens.text,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
    },
    secondaryText: {
      color: tokens.textMuted,
      fontSize: typo.fontSizes.xs,
      marginTop: 2,
    },
    emptyWrap: {
      paddingVertical: s.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: tokens.textMuted,
      fontSize: typo.fontSizes.sm,
    },
  });
}
