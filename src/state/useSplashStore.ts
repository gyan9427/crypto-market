import { create } from 'zustand';

interface SplashState {
  /** True after the branded splash animation has finished this JS session. Not persisted across reloads. */
  done: boolean;
  markDone: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  done: false,
  markDone: () => set({ done: true }),
}));
