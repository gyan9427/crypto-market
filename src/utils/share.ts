import { Share } from 'react-native';
import type { NewsItem } from '@/src/types';

type ShareableNews = Pick<NewsItem, 'title' | 'url' | 'sourceUrl'>;

function getArticleUrl(item: ShareableNews): string | undefined {
  const candidate = item.url ?? item.sourceUrl;
  const trimmed = candidate?.trim();
  return trimmed ? trimmed : undefined;
}

export async function shareNewsItem(item: ShareableNews): Promise<boolean> {
  const articleUrl = getArticleUrl(item);
  const message = articleUrl ? `${item.title}\n${articleUrl}` : item.title;

  const result = await Share.share({
    title: item.title,
    subject: item.title,
    message,
    url: articleUrl,
  });

  return result.action === Share.sharedAction;
}
