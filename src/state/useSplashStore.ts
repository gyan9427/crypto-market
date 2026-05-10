import { create } from 'zustand';

interface SplashState {
  /** True after the branded splash animation has finished for this cold start/session. Not persisted. */
  done: boolean;
  markDone: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  done: false,
  markDone: () => set({ done: true }),
}));
