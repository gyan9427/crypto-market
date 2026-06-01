import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AuthPalette } from '@/src/components/auth/authPalette';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const secondaryElevation =
  Platform.OS === 'web'
    ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
        }
      : { elevation: 1 };

type Props = {
  palette: AuthPalette;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function GoogleGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.749 34.743 29.454 37 24 37c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.106 0 5.974 1.09 8.229 2.917l5.834-5.834C34.725 8.084 29.694 6 24 6 12.955 6 4 14.955 4 26s8.955 20 20 20 20-8.955 20-20c0-1.341-.146-2.669-.389-4.017z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.572 4.818C14.659 17.324 18.957 13 24 13c3.059 0 5.836 1.179 7.961 3.068l6.069-6.069C34.534 7.089 29.579 5 24 5 17.079 5 11.097 8.087 7.086 13.791z"
      />
      <Path
        fill="#4CAF50"
        d="M24 45c5.569 0 10.734-2.054 14.596-5.527l-6.743-5.688C29.734 37.086 26.957 39 24 39c-5.421 0-10.068-3.459-11.849-8.297l-6.734 5.188C11.086 41.982 17.069 45 24 45z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H24v8h10.086c-.436 2.357-2.069 5.086-6.086 8.697l-.002-.001 6.743 5.688C42.069 43.086 43.611 35.962 43.611 27.273c0-2.489-.259-4.917-.734-7.273z"
      />
    </Svg>
  );
}

export function GoogleButton({ palette, label, onPress, disabled, loading }: Props) {
  const pressed = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const busy = loading || disabled;

  return (
    <AnimatedPressable
      style={[
        styles.btn,
        secondaryElevation,
        {
          backgroundColor: palette.googleSurface,
          borderColor: palette.googleBorder,
          opacity: busy ? 0.55 : 1,
        },
        anim,
      ]}
      onPress={() => !busy && onPress()}
      disabled={busy}
      onPressIn={() => {
        if (busy) return;
        pressed.value = withTiming(0.98, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(1, { duration: 160 });
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.row}>
        <GoogleGlyph />
        {loading ? (
          <ActivityIndicator color={palette.textSecondary} style={styles.spinner} />
        ) : (
          <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.02,
    marginLeft: 10,
  },
  spinner: {
    marginLeft: 10,
  },
});
