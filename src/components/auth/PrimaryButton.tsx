import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AuthPalette } from '@/src/components/auth/authPalette';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BTN_RADIUS = 27;

const btnElevation =
  Platform.OS === 'web'
    ? { boxShadow: '0px 14px 32px rgba(15,23,42,0.09)' }
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 22,
        }
      : { elevation: 5 };

type Props = {
  palette: AuthPalette;
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({
  palette,
  title,
  onPress,
  loading,
  disabled,
  accessibilityLabel,
}: Props) {
  const pressed = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const busy = loading || disabled;

  return (
    <AnimatedPressable
      onPress={() => !busy && onPress()}
      onPressIn={() => {
        if (busy) return;
        pressed.value = withTiming(0.98, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(1, { duration: 160 });
      }}
      disabled={busy}
      style={[
        styles.btn,
        btnElevation,
        { backgroundColor: palette.primaryGreen, opacity: busy ? 0.65 : 1 },
        anim,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.btnText}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 54,
    borderRadius: BTN_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: 24,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
});
