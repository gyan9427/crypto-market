import { useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type HorizontalScrollInteractionProps = {
  /** Fired when the horizontal scroller begins or ends drag/momentum/touch. */
  onScrollInteractionChange?: (active: boolean) => void;
};

/** px/ms — pre-empt momentum ownership before onMomentumScrollBegin fires. */
const MOMENTUM_VELOCITY_THRESHOLD = 0.05;

/**
 * Tracks touch + drag + momentum on a nested horizontal ScrollView/FlatList and notifies
 * the parent when it should yield gesture ownership (e.g. disable vertical feed scroll).
 */
export function useHorizontalScrollInteractionHandlers(
  onScrollInteractionChange?: (active: boolean) => void
) {
  const touchingRef = useRef(false);
  const draggingRef = useRef(false);
  const momentumRef = useRef(false);
  const lastActiveRef = useRef(false);

  const syncInteraction = useCallback(() => {
    const active = touchingRef.current || draggingRef.current || momentumRef.current;
    if (active === lastActiveRef.current) return;
    lastActiveRef.current = active;
    onScrollInteractionChange?.(active);
  }, [onScrollInteractionChange]);

  useEffect(() => {
    return () => {
      touchingRef.current = false;
      draggingRef.current = false;
      momentumRef.current = false;
      if (lastActiveRef.current) {
        lastActiveRef.current = false;
        onScrollInteractionChange?.(false);
      }
    };
  }, [onScrollInteractionChange]);

  const markTouching = useCallback(
    (touching: boolean) => {
      touchingRef.current = touching;
      syncInteraction();
    },
    [syncInteraction]
  );

  const onTouchStart = useCallback(() => {
    markTouching(true);
  }, [markTouching]);

  const onTouchEnd = useCallback(() => {
    markTouching(false);
  }, [markTouching]);

  const onTouchCancel = useCallback(() => {
    markTouching(false);
  }, [markTouching]);

  const onScrollBeginDrag = useCallback(() => {
    draggingRef.current = true;
    syncInteraction();
  }, [syncInteraction]);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      draggingRef.current = false;
      const vx = event.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(vx) > MOMENTUM_VELOCITY_THRESHOLD) {
        momentumRef.current = true;
      }
      syncInteraction();
    },
    [syncInteraction]
  );

  const onMomentumScrollBegin = useCallback(() => {
    momentumRef.current = true;
    syncInteraction();
  }, [syncInteraction]);

  const onMomentumScrollEnd = useCallback(() => {
    momentumRef.current = false;
    syncInteraction();
  }, [syncInteraction]);

  return {
    touchInteractionHandlers: {
      onTouchStart,
      onTouchEnd,
      onTouchCancel,
      // Capture phase runs before bubble; locks parent before vertical feed can claim upward drags.
      onTouchStartCapture: onTouchStart,
      onTouchEndCapture: onTouchEnd,
      onTouchCancelCapture: onTouchCancel,
    },
    scrollInteractionHandlers: {
      onScrollBeginDrag,
      onScrollEndDrag,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
    },
  };
}

/** Shared props for nested horizontal lists inside a vertical feed. */
export const NESTED_HORIZONTAL_LIST_PROPS = {
  nestedScrollEnabled: true,
  scrollEventThrottle: 16,
  directionalLockEnabled: true,
} as const;
