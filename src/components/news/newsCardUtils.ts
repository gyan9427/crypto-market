import type { Coin, FeedCardProps } from '@/src/types';

export const TITLE_LINES_FEED = 2;
export const SNIPPET_LINES_FEED = 2;

export function normalizeText(s: string): string {
  return s.trim().toLowerCase();
}

export function isDuplicateOfTitle(title: string, body: string): boolean {
  const t = normalizeText(title);
  const b = normalizeText(body);
  if (!b.length) return true;
  if (b === t) return true;
  if (b.startsWith(t) && b.length <= t.length + 3) return true;
  return b.startsWith(t + ' ') || b.startsWith(t + '—') || b.startsWith(t + '–');
}

export function rawSnippetFields(item: {
  subtitle?: string;
  content?: string;
  snippet: string;
}): string {
  return item.subtitle || item.content || item.snippet || '';
}

export function coinHeaderTitle(coin: { name: string; symbol: string }): string {
  return `${coin.name}${coin.symbol ? ` · ${coin.symbol}` : ''}`;
}

/** Map API relatedCoins refs (ids or symbols) to Coin objects for display. */
export function resolveNewsItemCoins(relatedRefs: string[], batchCoins: Coin[] = []): Coin[] {
  const resolved: Coin[] = [];
  const seen = new Set<string>();

  for (const ref of relatedRefs) {
    const key = ref.trim();
    if (!key) continue;
    const upper = key.toUpperCase();

    const match =
      batchCoins.find((c) => c.id === key || c.id === upper) ||
      batchCoins.find((c) => c.symbol.toUpperCase() === upper);

    const coin: Coin =
      match ?? {
        id: upper,
        symbol: upper,
        name: upper,
        price: 0,
        change24h: 0,
      };

    const dedupeKey = (coin.symbol || coin.id).toUpperCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    resolved.push(coin);
  }

  return resolved;
}

export function coinsHeaderPrimaryLine(coins: { name: string; symbol: string }[]): string {
  if (coins.length === 0) return '';
  if (coins.length === 1) return coinHeaderTitle(coins[0]);
  const parts = coins.slice(0, 3).map((c) => (c.symbol || c.name).toUpperCase());
  const suffix = coins.length > 3 ? ` +${coins.length - 3}` : '';
  return parts.join(' · ') + suffix;
}

export function coinAvatarInitial(coins: Coin[], fallback = 'C'): string {
  const primary = coins[0];
  if (!primary) return fallback;
  return (primary.symbol?.[0] || primary.name?.[0] || fallback).toUpperCase();
}

export function areNewsCardPropsEqual(prev: FeedCardProps, next: FeedCardProps): boolean {
  if (prev.variant !== next.variant) return false;
  if (prev.onPress !== next.onPress) return false;
  const a = prev.item;
  const b = next.item;
  if (a.id !== b.id) return false;
  if (a.userReaction !== b.userReaction) return false;
  if (a.isSaved !== b.isSaved) return false;
  if (a.comments !== b.comments) return false;
  if (a.shares !== b.shares) return false;
  if ((a.saveCount ?? 0) !== (b.saveCount ?? 0)) return false;
  if ((a.reactions?.total ?? 0) !== (b.reactions?.total ?? 0)) return false;
  if (a.title !== b.title) return false;
  if (a.snippet !== b.snippet) return false;
  if (a.subtitle !== b.subtitle) return false;
  if (a.imageUrl !== b.imageUrl) return false;
  if (a.coins.length !== b.coins.length) return false;
  for (let i = 0; i < a.coins.length; i++) {
    const ac = a.coins[i];
    const bc = b.coins[i];
    if ((ac?.id ?? '') !== (bc?.id ?? '')) return false;
    if ((ac?.symbol ?? '') !== (bc?.symbol ?? '')) return false;
    if ((ac?.isFollowing ?? false) !== (bc?.isFollowing ?? false)) return false;
  }
  return true;
}
