import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useFocusEffect } from "expo-router/react-navigation";
import {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
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

type CollapsibleScrollHandlerOptions = {
  /** Fired on the JS thread when scroll position is within `endReachOffsetPx` of the bottom. */
  onNearEnd?: () => void;
  endReachOffsetPx?: number;
};

/** Attach to FlatList / ScrollView; resets header when the screen gains focus. */
export function useCollapsibleNavHeaderScrollHandlers(
  options?: CollapsibleScrollHandlerOptions
) {
  const { headerOffset, maxHeaderOffset, resetHeader } = useCollapsibleNavHeader();
  const lastScrollY = useSharedValue(0);
  const lastNearEndAt = useSharedValue(0);
  const onNearEnd = options?.onNearEnd;
  const endReachOffsetPx = options?.endReachOffsetPx ?? 320;
  const nearEndCooldownMs = 400;

  useFocusEffect(
    useCallback(() => {
      resetHeader();
    }, [resetHeader])
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      if (y <= 0) {
        headerOffset.value = 0;
        lastScrollY.value = 0;
      } else {
        const dy = y - lastScrollY.value;
        lastScrollY.value = y;

        const max = maxHeaderOffset.value;
        if (max > 0) {
          const next = headerOffset.value + dy;
          headerOffset.value = Math.min(Math.max(next, 0), max);
        }
      }

      if (onNearEnd) {
        const { layoutMeasurement, contentOffset, contentSize } = event;
        if (contentSize.height <= 0 || layoutMeasurement.height <= 0) return;

        const distanceFromEnd =
          contentSize.height - (layoutMeasurement.height + contentOffset.y);
        if (distanceFromEnd <= endReachOffsetPx) {
          const now = Date.now();
          if (now - lastNearEndAt.value >= nearEndCooldownMs) {
            lastNearEndAt.value = now;
            runOnJS(onNearEnd)();
          }
        }
      }
    },
  });

  return {
    onScroll: scrollHandler,
    scrollEventThrottle: 16 as const,
  };
}
