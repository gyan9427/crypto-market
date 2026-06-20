const SHARE_PATH = /^\/share\/([^/?#]+)/;

/** Extract article id from HTTPS universal links or nayft:// custom scheme URLs. */
export function parseShareArticleIdFromUrl(rawUrl: string): string | null {
  if (!rawUrl?.trim()) return null;

  try {
    const parsed = new URL(rawUrl.trim());

    if (parsed.protocol === 'nayft:') {
      const path = parsed.pathname || '';
      const match = path.match(SHARE_PATH);
      if (match?.[1]) return decodeURIComponent(match[1]);
      if (parsed.hostname === 'share' && parsed.pathname.length > 1) {
        return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
      }
      return null;
    }

    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      const match = parsed.pathname.match(SHARE_PATH);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
  } catch {
    return null;
  }

  return null;
}

export function buildShareDeepLinkPath(articleId: string): `/share/${string}` {
  return `/share/${encodeURIComponent(articleId)}`;
}
