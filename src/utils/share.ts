import { Platform, Share } from 'react-native';
import type { NewsItem } from '@/src/types';

type ShareableNews = Pick<NewsItem, 'title' | 'url' | 'sourceUrl'>;

function getArticleUrl(item: ShareableNews): string | undefined {
  const candidate = item.url ?? item.sourceUrl;
  const trimmed = candidate?.trim();
  return trimmed ? trimmed : undefined;
}

function buildShareMessage(item: ShareableNews): { title: string; message: string; articleUrl?: string } {
  const title = item.title;
  const articleUrl = getArticleUrl(item);
  const message = articleUrl ? `${title}\n${articleUrl}` : title;
  return { title, message, articleUrl };
}

async function shareOnWeb(item: ShareableNews): Promise<boolean> {
  const { title, message, articleUrl } = buildShareMessage(item);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const payload: ShareData = articleUrl
        ? { title, text: title, url: articleUrl }
        : { title, text: message };
      await navigator.share(payload);
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return false;
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(message);
    return true;
  }

  return copyTextFallback(message);
}

function copyTextFallback(text: string): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }

  return Promise.resolve(copied);
}

export async function shareNewsItem(item: ShareableNews): Promise<boolean> {
  if (Platform.OS === 'web') {
    return shareOnWeb(item);
  }

  const { title, message, articleUrl } = buildShareMessage(item);

  const result = await Share.share({
    title,
    message,
    url: articleUrl,
  });

  return result.action === Share.sharedAction;
}

export async function shareNewsById(
  newsId: string,
  sources: ReadonlyArray<{ id: string } & ShareableNews>
): Promise<boolean> {
  const item = sources.find((entry) => entry.id === newsId);
  if (!item) return false;
  return shareNewsItem(item);
}
