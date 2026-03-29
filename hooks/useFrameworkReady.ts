import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // React Native has no global `window`; only web / some Expo web builds do.
    try {
      const g = globalThis as typeof globalThis & {
        window?: { frameworkReady?: () => void };
      };
      g.window?.frameworkReady?.();
    } catch {
      // ignore — Bolt/web-only hook
    }
  });
}
