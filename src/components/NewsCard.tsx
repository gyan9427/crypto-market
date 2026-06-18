import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { openInAppBrowser } from '../utils/browser';
import { useTranslation } from 'react-i18next';
import { trackArticleOpened, trackSourceClicked } from '../utils/trackEvent';
import { ExternalLink, FileText, Check, Bookmark, Share2 } from 'lucide-react-native';
import { SourceBadge } from './news/SourceBadge';
import { FeedCardProps } from '../types';
import { formatTimeAgo } from '../utils/format';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useHasFeature } from '../utils/features';
import { useAppStore } from '../state/useAppStore';
import { NewsCardGrid } from './news/NewsCardGrid';
import { ReactionPicker } from './ReactionPicker';
import { NewsCoinTags } from './news/NewsCoinTags';
import { CoinIcon } from './CoinIcon';
import {
  TITLE_LINES_FEED,
  SNIPPET_LINES_FEED,
  areNewsCardPropsEqual,
  coinAvatarInitial,
  isDuplicateOfTitle,
  rawSnippetFields,
} from './news/newsCardUtils';
import { buildNewsCardStyles } from './news/newsCardStyles';

export const NewsCard = React.memo<FeedCardProps>(({
  item,
  variant = 'compact',
  onReact,
  onComment,
  onShare,
  onSave,
  onPress,
  onCoinPress,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildNewsCardStyles(tokens), [tokens]);
  const c = tokens.colors;
  const hasFollow = useHasFeature('follow');
  const isSaved = item.isSaved || false;
  const isGrid = variant === 'grid';
  const isExpandedLayout = variant === 'expanded';
  const articleSaveCount = item.saveCount ?? 0;

  const followingCoins = useAppStore((s) => s.followingCoins);
  const toggleFollowCoin = useAppStore((s) => s.toggleFollowCoin);
  const [followBusy, setFollowBusy] = useState(false);

  const feedSnippet = useMemo(() => {
    const raw = rawSnippetFields(item);
    if (!raw.trim()) return '';
    if (isDuplicateOfTitle(item.title, raw)) return '';
    return raw;
  }, [item]);

  const handleFollowToggle = useCallback(async () => {
    const coin = item.coinContext?.primaryCoin ?? item.coins[0];
    if (!coin) return;
    setFollowBusy(true);
    try {
      await toggleFollowCoin(coin.id);
    } finally {
      setFollowBusy(false);
    }
  }, [item.coinContext, item.coins, toggleFollowCoin]);

  if (isGrid) {
    return <NewsCardGrid item={item} styles={styles} />;
  }

  const coinContext = item.coinContext;
  const displayCoins = coinContext?.orderedCoins ?? item.coins;
  const primaryCoin = coinContext?.primaryCoin ?? displayCoins[0];
  const highlightRisk =
    coinContext?.prioritySource === 'rrs' && (coinContext?.priorityScore ?? 0) >= 0.5;
  const showRelatedInCard = isExpandedLayout && item.relatedCoins && item.relatedCoins.length > 0;

  const isFollowingCoin =
    primaryCoin != null &&
    (followingCoins.includes(primaryCoin.id) || Boolean(primaryCoin.isFollowing));

  const openExternalArticle = () => {
    trackArticleOpened(item.id);
    openInAppBrowser(item.url || item.sourceUrl!);
  };

  return (
    <View style={styles.container}>

      {displayCoins.length === 0 ? (
        <View style={styles.header}>
          <Text style={styles.sourceAttribution}>{t('news.defaultAttribution')}</Text>
        </View>
      ) : null}

      {(displayCoins.length > 0 || (hasFollow && primaryCoin != null)) && (
        <View style={styles.cardTopBar}>
          <View style={styles.cardTopBarLeft}>
            {primaryCoin != null ? (
              <>
                <CoinIcon
                  coin={primaryCoin}
                  onPress={onCoinPress}
                  size={32}
                  highlightRisk={highlightRisk}
                />
                <Text style={styles.cardTopBarSymbol} numberOfLines={1}>
                  {primaryCoin.symbol}
                </Text>
              </>
            ) : null}
            <Text style={styles.cardTopBarSource} numberOfLines={1}>
              {'· '}{formatTimeAgo(item.publishedAt)}
            </Text>
          </View>
          <View style={styles.cardTopBarRight}>
            <TouchableOpacity
              onPress={() => onSave?.(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? t('accessibility.unsaveArticle') : t('accessibility.saveArticle')}
            >
              <Bookmark
                size={18}
                color={isSaved ? c.primary[tokens.isDark ? 400 : 500] : tokens.textMuted}
                fill={isSaved ? c.primary[tokens.isDark ? 400 : 500] : 'none'}
              />
            </TouchableOpacity>
            {hasFollow && primaryCoin != null ? (
              <TouchableOpacity
                style={[styles.followButton, isFollowingCoin && styles.followButtonFollowing]}
                onPress={handleFollowToggle}
                disabled={followBusy}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={isFollowingCoin ? t('accessibility.unfollowCoin') : t('accessibility.followCoin')}
              >
                {!followBusy && isFollowingCoin && (
                  <Check size={11} color={c.primary[tokens.isDark ? 400 : 700]} strokeWidth={2.5} />
                )}
                <Text style={[styles.followText, isFollowingCoin && styles.followTextFollowing]}>
                  {followBusy ? t('common.ellipsis') : isFollowingCoin ? t('coin.following') : t('coin.follow')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.heroOuter}>
        <Pressable
          onPress={() => onPress?.(item.id)}
          disabled={!onPress}
          style={({ pressed }) => [
            styles.heroPressable,
            pressed && onPress && styles.cardPressablePressed,
          ]}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={onPress ? t('news.openArticleTitle', { title: item.title }) : undefined}
        >
          <View style={styles.heroWrap}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                accessibilityLabel={t('accessibility.articleImage')}
                transition={200}
              />
            ) : (
              <View style={styles.heroPlaceholder} accessibilityLabel={t('accessibility.noArticleImage')}>
                <Text style={styles.heroPlaceholderText}>
                  {coinAvatarInitial(primaryCoin ? [primaryCoin] : displayCoins, 'N')}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.tagsActionsRow}>
          <NewsCoinTags coins={displayCoins} onCoinPress={onCoinPress} style={styles.tagsActionsRowTags} />
          <View style={styles.tagsActionsRowRight}>
            <ReactionPicker
              reactions={item.reactions}
              userReaction={item.userReaction}
              onReact={(type) => onReact?.(item.id, type)}
            />
            <TouchableOpacity
              onPress={() => onShare?.(item.id)}
              style={styles.shareButton}
              accessibilityRole="button"
              accessibilityLabel={t('accessibility.share')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Share2 size={16} color={tokens.textMuted} />
              <Text style={styles.shareText}>{t('news.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Pressable
          onPress={() => onPress?.(item.id)}
          disabled={!onPress}
          style={({ pressed }) => [
            styles.cardPressable,
            pressed && onPress && styles.cardPressablePressed,
          ]}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={onPress ? t('news.openArticleTitle', { title: item.title }) : undefined}
        >
          <Text style={styles.title} numberOfLines={TITLE_LINES_FEED}>
            {item.title}
          </Text>
          {feedSnippet.length > 0 && (
            <Text style={styles.snippet} numberOfLines={SNIPPET_LINES_FEED}>
              {feedSnippet}
            </Text>
          )}
        </Pressable>
        {showRelatedInCard && (
          <View style={styles.relatedCoinsSection}>
            <Text style={styles.relatedCoinsHeader}>{t('news.relatedCoins')}</Text>
            <View style={styles.relatedCoinsRow}>
              {item.relatedCoins!.map((coinId) => (
                <TouchableOpacity
                  key={coinId}
                  style={styles.relatedCoinBadge}
                  onPress={() => onCoinPress?.(coinId)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.relatedCoinBadgeText}>{coinId}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        {(item.url || item.sourceUrl) && (
          <TouchableOpacity
            onPress={openExternalArticle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.openSiteTouchable}
            accessibilityRole="link"
            accessibilityLabel={t('accessibility.openInBrowser')}
          >
            <ExternalLink size={30} color={c.primary[tokens.isDark ? 400 : 500]} />
            <View style={styles.openSiteTextWrap}>
              <Text style={styles.openSiteText}>{t('news.sourceArticle')}</Text>
              <SourceBadge
                sourceInfo={item.sourceInfo}
                sourceName={item.source}
                onPress={() => {
                  trackSourceClicked(item.id, item.sourceInfo?.sourceKey ?? '', 'card');
                  openInAppBrowser(item.url || item.sourceUrl!);
                }}
              />
            </View>
          </TouchableOpacity>
        )}
        {(item.url || item.sourceUrl) && onPress ? (
          <View style={styles.footerDivider} />
        ) : null}
        {onPress ? (
          <TouchableOpacity
            onPress={() => onPress(item.id)}
            style={styles.primaryCta}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.readArticle')}
          >
            <FileText size={30} color={c.primary[tokens.isDark ? 400 : 500]} strokeWidth={2} />
            <View style={styles.primaryCtaTextWrap}>
              <Text style={styles.primaryCtaLabel}>{t('news.read')}</Text>
              <Text style={styles.primaryCtaSubLabel}>{t('news.summary')}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

    </View>
  );
}, areNewsCardPropsEqual);

NewsCard.displayName = 'NewsCard';
