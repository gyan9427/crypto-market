import { create } from 'zustand';

type FeedStoreState = {
  activeRiskRevision: number;
  setActiveRiskRevision: (revision: number) => boolean;
};

export const useFeedStore = create<FeedStoreState>((set, get) => ({
  activeRiskRevision: 0,

  setActiveRiskRevision: (revision: number) => {
    if (!Number.isFinite(revision) || revision < get().activeRiskRevision) {
      return false;
    }
    set({ activeRiskRevision: revision });
    return true;
  },
}));
