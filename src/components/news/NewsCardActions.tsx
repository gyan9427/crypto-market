import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Share2 } from 'lucide-react-native';
import { ReactionPicker } from '../ReactionPicker';
import type { FeedCardProps } from '@/src/types';
import type { ThemeTokens } from '@/src/theme/theme';
import { useHasFeature } from '@/src/utils/features';

type Props = {
  item: FeedCardProps['item'];
  tokens: ThemeTokens;
  styles: Record<string, object>;
  onReact?: FeedCardProps['onReact'];
  onComment?: FeedCardProps['onComment'];
  onShare?: FeedCardProps['onShare'];
};

export function NewsCardActions({
  item,
  tokens,
  styles,
  onReact,
  onShare,
}: Props) {
  const { t } = useTranslation();
  const hasComments = useHasFeature('comments');

  return (
    <View style={styles.actionsRow}>
      <View style={styles.spacer} />

      {/* Reactions */}
      <ReactionPicker
        reactions={item.reactions}
        userReaction={item.userReaction}
        onReact={(type) => onReact?.(item.id, type)}
      />

      {/* Share */}
      <TouchableOpacity
        style={[styles.actionButton, (styles as any).shareButton]}
        onPress={() => onShare?.(item.id)}
        accessibilityRole="button"
        accessibilityLabel={t('accessibility.share')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Share2 size={16} color={tokens.textMuted} />
        <Text style={(styles as any).shareText}>{t('news.share')}</Text>
      </TouchableOpacity>
    </View>
  );
}
