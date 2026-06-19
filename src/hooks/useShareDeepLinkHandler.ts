import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { parseShareArticleIdFromUrl, buildShareDeepLinkPath } from '@/src/navigation/parseShareDeepLink';

/**
 * Fallback handler for share universal links / nayft:// URLs when the app is already running.
 * Expo Router handles cold-start paths; this covers warm-start `url` events.
 */
export function useShareDeepLinkHandler(enabled: boolean): void {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleUrl = (url: string | null) => {
      if (!url) return;
      const articleId = parseShareArticleIdFromUrl(url);
      if (!articleId) return;
      router.push(buildShareDeepLinkPath(articleId) as Href);
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [enabled, router]);
}
