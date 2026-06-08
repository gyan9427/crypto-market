import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FeedCardProps } from '@/src/types';
import { NewsCoinTags } from './NewsCoinTags';

type Props = {
  item: FeedCardProps['item'];
  styles: Record<string, object>;
};

export function NewsCardGrid({ item, styles }: Props) {
  const { t } = useTranslation();
  return (
    <View style={[styles.container, styles.gridContainer]}>
      {item.coins.length === 0 ? (
        <Text style={styles.gridSource}>{t('news.defaultAttribution')}</Text>
      ) : null}
      <NewsCoinTags
        coins={(item.coinContext?.orderedCoins ?? item.coins).slice(0, 4)}
        style={{ marginBottom: 8 }}
      />
      <Text style={styles.gridTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.gridSnippet} numberOfLines={3}>
        {item.subtitle || item.snippet || item.content || ''}
      </Text>
    </View>
  );
}
