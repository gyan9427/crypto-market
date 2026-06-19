import { create } from 'zustand';

type PendingShareState = {
  articleId: string | null;
  setArticleId: (id: string | null) => void;
  consumeArticleId: () => string | null;
};

export const usePendingShareStore = create<PendingShareState>((set, get) => ({
  articleId: null,
  setArticleId: (id) => set({ articleId: id?.trim() || null }),
  consumeArticleId: () => {
    const id = get().articleId;
    set({ articleId: null });
    return id;
  },
}));

/** Post-login destination when a share deep link was deferred. */
export function resolvePostAuthHref(emailVerified: boolean): string {
  const pending = usePendingShareStore.getState().consumeArticleId();
  if (pending && emailVerified) {
    return `/share/${encodeURIComponent(pending)}`;
  }
  if (!emailVerified) return '/verify-email';
  return '/(tabs)';
}
