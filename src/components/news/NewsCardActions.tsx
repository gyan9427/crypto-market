import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import { ReactionPicker } from '../ReactionPicker';
import { abbreviateNumber } from '@/src/utils/format';
import type { FeedCardProps } from '@/src/types';
import type { ThemeTokens } from '@/src/theme/theme';
import { useHasFeature } from '@/src/utils/features';

type Props = {
  item: FeedCardProps['item'];
  tokens: ThemeTokens;
  styles: Record<string, object>;
  isSaved: boolean;
  articleSaveCount: number;
  onReact?: FeedCardProps['onReact'];
  onComment?: FeedCardProps['onComment'];
  onShare?: FeedCardProps['onShare'];
  onSave?: FeedCardProps['onSave'];
};

export function NewsCardActions({
  item,
  tokens,
  styles,
  isSaved,
  articleSaveCount,
  onReact,
  onComment,
  onShare,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const c = tokens.colors;
  const hasComments = useHasFeature('comments');

  return (
    <View style={styles.actionsRow}>
      <ReactionPicker
        reactions={item.reactions}
        userReaction={item.userReaction}
        onReact={(type) => onReact?.(item.id, type)}
      />

      {hasComments && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.comment')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MessageCircle size={20} color={tokens.textMuted} />
          {item.comments > 0 && (
            <Text style={styles.actionText}>{abbreviateNumber(item.comments)}</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onShare?.(item.id)}
        accessibilityRole="button"
        accessibilityLabel={t('accessibility.share')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Share2 size={20} color={tokens.textMuted} />
        {item.shares > 0 && (
          <Text style={styles.actionText}>{abbreviateNumber(item.shares)}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onSave?.(item.id)}
        accessibilityRole="button"
        accessibilityLabel={
          isSaved ? t('accessibility.unsaveArticle') : t('accessibility.saveArticle')
        }
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Bookmark
          size={20}
          color={isSaved ? c.primary[500] : tokens.textMuted}
          fill={isSaved ? c.primary[500] : 'none'}
        />
        {(isSaved || articleSaveCount > 0) && (
          <Text style={[styles.actionText, isSaved && styles.actionTextSaved]}>
            {abbreviateNumber(articleSaveCount)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
