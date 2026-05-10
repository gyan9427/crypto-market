import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface NextButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

function NextButtonInner({ label, onPress, style }: NextButtonProps) {
  const { tokens } = useAppTheme();
  const styles = buildNextButtonStyles(tokens);
  const pressed = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(0.98, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(1, { duration: 160 });
      }}
      style={[styles.btnWrapper, btnGlow, anim, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={['#a855f7', '#d946ef']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

function buildNextButtonStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  return StyleSheet.create({
    btnWrapper: {
      borderRadius: 8,
      overflow: 'hidden',
      minWidth: 200,
    },
    gradient: {
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    label: {
      color: '#ffffff',
      fontSize: typo.fontSizes.base,
      fontWeight: '600',
      letterSpacing: 0.02,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
  });
}

export const NextButton = memo(NextButtonInner);
