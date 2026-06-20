import React, { memo, useMemo } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePressScale } from '@/src/design-system/motion/usePressScale';
import { getMarketUiPalette } from '@/src/theme/chartPalette';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type AppIconButtonVariant = 'default' | 'ghost' | 'overlay';
export type AppIconButtonSize = 'sm' | 'md' | 'lg';

export type AppIconButtonProps = Omit<PressableProps, 'children'> & {
  variant?: AppIconButtonVariant;
  size?: AppIconButtonSize;
  children: React.ReactNode;
  accessibilityLabel: string;
};

function buildIconButtonStyles(
  tokens: ThemeTokens,
  variant: AppIconButtonVariant,
  size: AppIconButtonSize
) {
  const dim = { sm: 36, md: 44, lg: 52 }[size];
  const ui = getMarketUiPalette(tokens);
  let backgroundColor = tokens.surfaceMuted;
  if (variant === 'ghost') backgroundColor = 'transparent';
  if (variant === 'overlay') backgroundColor = ui.overlayControlBg;

  return StyleSheet.create({
    pressable: {
      width: dim,
      height: dim,
      minWidth: 44,
      minHeight: 44,
      borderRadius: dim / 2,
      backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: variant === 'default' ? StyleSheet.hairlineWidth : 0,
      borderColor: tokens.border,
    },
  });
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AppIconButtonComponent({
  variant = 'default',
  size = 'md',
  children,
  accessibilityLabel,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: AppIconButtonProps) {
  const { tokens } = useAppTheme();
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } =
    usePressScale();
  const styles = useMemo(
    () => buildIconButtonStyles(tokens, variant, size),
    [tokens, variant, size]
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        scaleIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scaleOut();
        onPressOut?.(e);
      }}
      style={[
        styles.pressable,
        animatedStyle,
        disabled && { opacity: tokens.opacity.disabled },
        style,
      ]}
      {...rest}
    >
      <View pointerEvents="none">{children}</View>
    </AnimatedPressable>
  );
}

export const AppIconButton = memo(AppIconButtonComponent);
