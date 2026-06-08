import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Platform,
  useWindowDimensions,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Single duration for open + close so base card, backdrop, and card stay in sync */
const TIMING_MS = 280;

/** Max upward shift (px) from the full-screen vertical center — limits motion on tall keyboards */
const MAX_KEYBOARD_NUDGE_PX = 120;

/** Fraction of keyboard height used with geometric center to cap excessive movement */
const KEYBOARD_NUDGE_FRACTION = 0.4;

/** Debounce focus → overlay open so keyboard/focus churn settles (see login screen) */
export const FLOATING_FIELD_FOCUS_OPEN_DELAY_MS = 50;

type SourceCenter = { cx: number; cy: number };

export type FloatingFieldFocusLayerProps = {
  activeField: 'email' | 'password' | null;
  sourceCenter: SourceCenter | null;
  onDismissComplete: () => void;
  children: React.ReactNode;
  /** Shared with parent so the base form dims/scales in sync with this overlay */
  progress: Animated.Value;
};

export type FloatingFieldFocusLayerRef = {
  dismiss: () => void;
  /** True while open (0→1) or close (1→0) animation is running */
  isAnimating: () => boolean;
};

/**
 * Full-screen overlay: dim + blur, glass card animates from measured focus origin.
 * Vertical position uses keyboard height (keyboardDidShow) so the card stays in the
 * band above the IME; nudge is capped (fraction + max px). Parent should not use
 * KeyboardAvoidingView for this screen — only this layer moves.
 *
 * Uses React Native Animated (not Reanimated) so Android builds without a
 * working native Reanimated module do not crash at load time.
 */
export const FloatingFieldFocusLayer = forwardRef<
  FloatingFieldFocusLayerRef,
  FloatingFieldFocusLayerProps
>(function FloatingFieldFocusLayer(
  { activeField, sourceCenter, onDismissComplete, children, progress },
  ref
) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  /** Mirrors keyboardHeight for open animation init without re-running open when IME height changes */
  const keyboardHeightRef = useRef(0);
  /** Vertical offset so the card sits in the band above the IME (animated, native driver) */
  const keyboardEndY = useRef(new Animated.Value(0)).current;

  const closingRef = useRef(false);
  /** True during open or close animation — blocks overlapping work */
  const isAnimatingRef = useRef(false);
  /** Open animation reached completion (floating card fully shown) */
  const openCompleteRef = useRef(false);
  /** Last known soft-keyboard visibility from Keyboard events */
  const keyboardVisibleRef = useRef(false);

  const visible = activeField !== null && sourceCenter !== null;

  /** Full-screen safe-area vertical center (keyboard ignored — used as open-animation target base) */
  const targetCenterYFull = useMemo(() => {
    const H = windowHeight - insets.top - insets.bottom;
    return insets.top + H / 2;
  }, [windowHeight, insets.top, insets.bottom]);

  const computeKeyboardNudgeY = useCallback(
    (kh: number) => {
      if (kh <= 0) return 0;
      const HAboveKb = windowHeight - kh - insets.top - insets.bottom;
      const targetAboveKb = insets.top + Math.max(0, HAboveKb) / 2;
      const deltaCenter = targetAboveKb - targetCenterYFull;
      const cap = Math.min(kh * KEYBOARD_NUDGE_FRACTION, MAX_KEYBOARD_NUDGE_PX);
      return Math.max(deltaCenter, -cap);
    },
    [windowHeight, insets.top, insets.bottom, targetCenterYFull]
  );

  const offsets = useMemo(() => {
    if (!sourceCenter) return { x: 0, y: 0 };
    return {
      x: sourceCenter.cx - windowWidth / 2,
      y: sourceCenter.cy - targetCenterYFull,
    };
  }, [sourceCenter, windowWidth, targetCenterYFull]);

  const finishDismiss = useCallback(() => {
    closingRef.current = false;
    onDismissComplete();
  }, [onDismissComplete]);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    openCompleteRef.current = false;
    isAnimatingRef.current = true;
    Keyboard.dismiss();
    progress.stopAnimation();
    keyboardEndY.stopAnimation();
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: TIMING_MS,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(keyboardEndY, {
        toValue: 0,
        duration: TIMING_MS,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(({ finished }) => {
      isAnimatingRef.current = false;
      closingRef.current = false;
      if (finished) {
        finishDismiss();
      }
    });
  }, [finishDismiss, progress, keyboardEndY]);

  useImperativeHandle(
    ref,
    () => ({
      dismiss,
      isAnimating: () => isAnimatingRef.current,
    }),
    [dismiss]
  );

  const sourceKey = sourceCenter ? `${sourceCenter.cx},${sourceCenter.cy}` : '';

  useEffect(() => {
    keyboardHeightRef.current = keyboardHeight;
  }, [keyboardHeight]);

  useEffect(() => {
    if (!visible || !sourceCenter) return;

    progress.stopAnimation();
    keyboardEndY.stopAnimation();
    progress.setValue(0);
    keyboardEndY.setValue(computeKeyboardNudgeY(keyboardHeightRef.current));
    openCompleteRef.current = false;
    isAnimatingRef.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: TIMING_MS,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(({ finished }) => {
      if (closingRef.current) return;
      isAnimatingRef.current = false;
      if (finished) {
        openCompleteRef.current = true;
      }
    });
  }, [visible, activeField, sourceKey, progress, computeKeyboardNudgeY, keyboardEndY]);

  /** Animate floating card vertically when keyboard height changes (IME show / hide) */
  useEffect(() => {
    if (!visible) {
      keyboardEndY.setValue(0);
      return;
    }
    const to = computeKeyboardNudgeY(keyboardHeight);
    keyboardEndY.stopAnimation();
    Animated.timing(keyboardEndY, {
      toValue: to,
      duration: TIMING_MS,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [keyboardHeight, visible, computeKeyboardNudgeY, keyboardEndY]);

  /**
   * Track keyboard + only auto-dismiss on hide when the overlay is fully open and the hide
   * follows a real show (avoids races with stale hides during open / our own Keyboard.dismiss).
   */
  useEffect(() => {
    if (!visible) return;

    const onKeyboardDidShow = (e: { endCoordinates?: { height?: number } }) => {
      keyboardVisibleRef.current = true;
      const h = e.endCoordinates?.height;
      if (typeof h === 'number' && h >= 0) {
        setKeyboardHeight(h);
      }
    };

    const onKeyboardDidHide = () => {
      keyboardVisibleRef.current = false;
      setKeyboardHeight(0);
      if (closingRef.current) return;
      /** Ignore hides until open animation finishes — stops stale hide vs. open races */
      if (!openCompleteRef.current) return;
      dismiss();
    };

    const subShow = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
    const subHide = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible, dismiss]);

  const { backdropStyle, cardStyle } = useMemo(() => {
    const backdropOpacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    const cardOpacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [offsets.x, 0],
    });
    const translateYFromFocus = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [offsets.y, 0],
    });
    const translateY = Animated.add(translateYFromFocus, keyboardEndY);
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });
    return {
      backdropStyle: { opacity: backdropOpacity },
      cardStyle: {
        opacity: cardOpacity,
        transform: [{ translateX }, { translateY }, { scale }],
      },
    };
  }, [progress, offsets.x, offsets.y, keyboardEndY]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.layerRoot]} pointerEvents="box-none">
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Animated.View style={[styles.backdropTint, backdropStyle]} />
      </Pressable>

      {Platform.OS !== 'web' && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.blurWrap, backdropStyle]}
          pointerEvents="none"
        >
          <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      <View style={styles.cardHitArea} pointerEvents="box-none">
        <Animated.View style={[styles.glassCard, cardStyle]}>{children}</Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  layerRoot: {
    zIndex: 1000,
    elevation: 1000,
  },
  backdropTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  blurWrap: {
    zIndex: 1,
  },
  cardHitArea: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  glassCard: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    zIndex: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 14 },
      web: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
      },
      default: {},
    }),
  },
});

export const floatingFieldTiming = { in: TIMING_MS, out: TIMING_MS };
