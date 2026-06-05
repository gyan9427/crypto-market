import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  useSharedValue,
  useAnimatedScrollHandler,
  type SharedValue,
} from 'react-native-reanimated';

type CollapsibleNavHeaderContextValue = {
  headerOffset: SharedValue<number>;
  maxHeaderOffset: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetHeader: () => void;
};

const CollapsibleNavHeaderContext = createContext<CollapsibleNavHeaderContextValue | null>(
  null
);

export function CollapsibleNavHeaderProvider({ children }: { children: React.ReactNode }) {
  const headerOffset = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const maxHeaderOffset = useSharedValue(0);

  const resetHeader = useCallback(() => {
    headerOffset.value = 0;
    lastScrollY.value = 0;
  }, [headerOffset, lastScrollY]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      if (y <= 0) {
        headerOffset.value = 0;
        lastScrollY.value = 0;
        return;
      }

      const dy = y - lastScrollY.value;
      lastScrollY.value = y;

      const max = maxHeaderOffset.value;
      if (max <= 0) return;

      const next = headerOffset.value + dy;
      headerOffset.value = Math.min(Math.max(next, 0), max);
    },
  });

  const value = useMemo(
    () => ({
      headerOffset,
      maxHeaderOffset,
      scrollHandler,
      resetHeader,
    }),
    [headerOffset, maxHeaderOffset, scrollHandler, resetHeader]
  );

  return (
    <CollapsibleNavHeaderContext.Provider value={value}>
      {children}
    </CollapsibleNavHeaderContext.Provider>
  );
}

export function useCollapsibleNavHeader() {
  const ctx = useContext(CollapsibleNavHeaderContext);
  if (!ctx) {
    throw new Error('useCollapsibleNavHeader must be used within CollapsibleNavHeaderProvider');
  }
  return ctx;
}

/** Attach to FlatList / ScrollView; resets header when the screen gains focus. */
export function useCollapsibleNavHeaderScrollHandlers() {
  const { scrollHandler, resetHeader } = useCollapsibleNavHeader();

  useFocusEffect(
    useCallback(() => {
      resetHeader();
    }, [resetHeader])
  );

  return {
    onScroll: scrollHandler,
    scrollEventThrottle: 16 as const,
  };
}
