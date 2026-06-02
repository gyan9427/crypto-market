import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FeedCardProps } from '@/src/types';
import { CoinStackAvatars } from './CoinStackAvatars';
import { CoinChip } from '../CoinChip';

type Props = {
  item: FeedCardProps['item'];
  styles: Record<string, object>;
};

export function NewsCardGrid({ item, styles }: Props) {
  const { t } = useTranslation();
  return (
    <View style={[styles.container, styles.gridContainer]}>
      {item.coins.length > 0 ? (
        <>
          <CoinStackAvatars coins={item.coins} maxVisible={3} />
          <View style={[styles.coinsRow, { marginTop: 8 }]}>
            {item.coins.slice(0, 2).map((coin) => (
              <CoinChip key={coin.id} coin={coin} />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.gridSource}>{t('news.defaultAttribution')}</Text>
      )}
      <Text style={styles.gridTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.gridSnippet} numberOfLines={3}>
        {item.subtitle || item.snippet || item.content || ''}
      </Text>
    </View>
  );
}
