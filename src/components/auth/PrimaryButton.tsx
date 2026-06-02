import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AuthPalette } from '@/src/components/auth/authPalette';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BTN_RADIUS = 12;

const btnGlow =
  Platform.OS === 'web'
    ? { boxShadow: '0 4px 20px rgba(168,85,247,0.30)' }
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#a855f7',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.30,
          shadowRadius: 14,
        }
      : { elevation: 6 };

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
        btnGlow,
        { opacity: busy ? 0.65 : 1 },
        anim,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      <LinearGradient
        colors={busy ? [palette.primary, palette.primary] : ['#a855f7', '#d946ef']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.btnText}>{title}</Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: BTN_RADIUS,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.02,
  },
});
