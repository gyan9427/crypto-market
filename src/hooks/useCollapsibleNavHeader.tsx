import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useFocusEffect } from "expo-router/react-navigation";
import {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

/** Ignore tiny scroll deltas that cause header expand/collapse oscillation. */
const SCROLL_DELTA_EPSILON = 2;
/** Snap header fully open when near the top of the scroll view. */
const TOP_EXPAND_Y = 8;

function applyCollapsibleHeaderScroll(
  y: number,
  headerOffset: SharedValue<number>,
  lastScrollY: SharedValue<number>,
  maxHeaderOffset: SharedValue<number>,
  headerScrollFrozen: SharedValue<number>
): void {
  'worklet';
  if (headerScrollFrozen.value === 1) {
    lastScrollY.value = y;
    return;
  }

  if (y <= TOP_EXPAND_Y) {
    headerOffset.value = 0;
    lastScrollY.value = y;
    return;
  }

  const dy = y - lastScrollY.value;
  lastScrollY.value = y;

  if (Math.abs(dy) < SCROLL_DELTA_EPSILON) {
    return;
  }

  const max = maxHeaderOffset.value;
  if (max <= 0) return;

  const next = headerOffset.value + dy;
  headerOffset.value = Math.min(Math.max(next, 0), max);
}

type CollapsibleNavHeaderContextValue = {
  headerOffset: SharedValue<number>;
  maxHeaderOffset: SharedValue<number>;
  /** When 1, header collapse/expand is paused (e.g. nested horizontal carousel active). */
  headerScrollFrozen: SharedValue<number>;
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
  const headerScrollFrozen = useSharedValue(0);

  const resetHeader = useCallback(() => {
    headerOffset.value = 0;
    lastScrollY.value = 0;
    headerScrollFrozen.value = 0;
  }, [headerOffset, lastScrollY, headerScrollFrozen]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      applyCollapsibleHeaderScroll(
        event.contentOffset.y,
        headerOffset,
        lastScrollY,
        maxHeaderOffset,
        headerScrollFrozen
      );
    },
  });

  const value = useMemo(
    () => ({
      headerOffset,
      maxHeaderOffset,
      headerScrollFrozen,
      scrollHandler,
      resetHeader,
    }),
    [headerOffset, maxHeaderOffset, headerScrollFrozen, scrollHandler, resetHeader]
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
  /** Fired on the JS thread with the latest vertical content offset. */
  onScrollY?: (y: number) => void;
};

/** Attach to FlatList / ScrollView; resets header when the screen gains focus. */
export function useCollapsibleNavHeaderScrollHandlers(
  options?: CollapsibleScrollHandlerOptions
) {
  const { headerOffset, maxHeaderOffset, headerScrollFrozen, resetHeader } =
    useCollapsibleNavHeader();
  const lastScrollY = useSharedValue(0);
  const lastNearEndAt = useSharedValue(0);
  const onNearEnd = options?.onNearEnd;
  const onScrollY = options?.onScrollY;
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

      applyCollapsibleHeaderScroll(
        y,
        headerOffset,
        lastScrollY,
        maxHeaderOffset,
        headerScrollFrozen
      );

      if (onScrollY) {
        runOnJS(onScrollY)(Math.max(0, y));
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
