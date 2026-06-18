import { Platform, Share } from 'react-native';
import type { NewsItem, NewsSourceInfo } from '@/src/types';
import { getAppStoreUrl, getPlayStoreUrl } from '@/src/config/shareUrls';
import { trackSourceShared } from '@/src/utils/trackEvent';

export type ShareableNews = Pick<
  NewsItem,
  | 'id'
  | 'title'
  | 'url'
  | 'sourceUrl'
  | 'source'
  | 'sourceInfo'
  | 'snippet'
  | 'subtitle'
  | 'publishedAt'
  | 'categories'
>;

export interface SharePayload {
  text: string;
  title: string;
  url?: string;
  richCard?: { templateId: string; variables: Record<string, string> };
}

type ShareChannel = 'native_sheet' | 'clipboard' | 'web_share';

function getArticleUrl(item: ShareableNews): string | undefined {
  const candidate = item.url ?? item.sourceUrl;
  const trimmed = candidate?.trim();
  return trimmed ? trimmed : undefined;
}

function getShareSummary(item: ShareableNews): string {
  const raw = item.snippet?.trim() || item.subtitle?.trim() || '';
  if (!raw) return '';
  return raw.length > 220 ? `${raw.slice(0, 217).trim()}…` : raw;
}

function getSourceName(item: ShareableNews): string {
  return item.sourceInfo?.name ?? item.source?.trim() ?? 'Unknown';
}

export function formatSharePayload(item: ShareableNews): SharePayload {
  const title = item.title.trim();
  const articleUrl = getArticleUrl(item);
  const sourceName = getSourceName(item);
  const summary = getShareSummary(item);
  const playStoreUrl = getPlayStoreUrl();
  const appStoreUrl = getAppStoreUrl();

  const lines: string[] = [title];

  if (summary) {
    lines.push('', summary);
  }

  lines.push('', `Source: ${sourceName}`, 'via NAYFT', '');

  if (articleUrl) {
    lines.push(articleUrl, '');
  }

  lines.push('Download NAYFT:', playStoreUrl, appStoreUrl);

  return {
    title,
    text: lines.join('\n'),
    url: articleUrl,
  };
}

function trackShareSuccess(item: ShareableNews, channel: ShareChannel): void {
  const newsId = item.id;
  const sourceKey = item.sourceInfo?.sourceKey ?? '';
  if (!newsId || !sourceKey) return;
  trackSourceShared(newsId, sourceKey, channel);
}

async function shareOnWeb(item: ShareableNews): Promise<boolean> {
  const { title, text, url: articleUrl } = formatSharePayload(item);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const payload: ShareData = articleUrl
        ? { title, text, url: articleUrl }
        : { title, text };
      await navigator.share(payload);
      trackShareSuccess(item, 'web_share');
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return false;
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    trackShareSuccess(item, 'clipboard');
    return true;
  }

  const copied = await copyTextFallback(text);
  if (copied) trackShareSuccess(item, 'clipboard');
  return copied;
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

async function shareNative(item: ShareableNews): Promise<boolean> {
  const { title, text } = formatSharePayload(item);

  try {
    const result = await Share.share({
      title,
      message: text,
    });
    const shared = result.action === Share.sharedAction;
    if (shared) trackShareSuccess(item, 'native_sheet');
    return shared;
  } catch {
    return false;
  }
}

export async function shareNewsItem(item: ShareableNews): Promise<boolean> {
  if (Platform.OS === 'web') {
    return shareOnWeb(item);
  }

  return shareNative(item);
}

export async function shareNewsById(
  newsId: string,
  sources: ReadonlyArray<{ id: string } & ShareableNews>
): Promise<boolean> {
  const item = sources.find((entry) => entry.id === newsId);
  if (!item) return false;
  return shareNewsItem(item);
}

export type { NewsSourceInfo };
