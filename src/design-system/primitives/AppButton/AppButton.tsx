import React, { memo, useMemo } from 'react';
import {
  Pressable,
  ActivityIndicator,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePressScale } from '@/src/design-system/motion/usePressScale';
import { AppText } from '../AppText';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export type AppButtonProps = Omit<PressableProps, 'children'> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
};

function buildButtonStyles(
  tokens: ThemeTokens,
  variant: AppButtonVariant,
  size: AppButtonSize,
  fullWidth: boolean
) {
  const heights = { sm: 36, md: 44, lg: 52 };
  const padH = { sm: tokens.spacing.md, md: tokens.spacing.lg, lg: tokens.spacing.xl };

  let backgroundColor = tokens.colors.primary[500];
  let borderColor = 'transparent';
  let labelColor = tokens.colors.white;

  switch (variant) {
    case 'secondary':
      backgroundColor = tokens.surface;
      borderColor = tokens.border;
      labelColor = tokens.text;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      labelColor = tokens.link;
      break;
    case 'destructive':
      backgroundColor = tokens.colors.danger[500];
      break;
  }

  return StyleSheet.create({
    pressable: {
      minHeight: heights[size],
      minWidth: 44,
      paddingHorizontal: padH[size],
      borderRadius:
        variant === 'primary'
          ? tokens.borderRadius.buttonPill
          : tokens.borderRadius.button,
      backgroundColor,
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: fullWidth ? ('stretch' as const) : undefined,
      opacity: 1,
    },
    label: {
      color: labelColor,
    },
  });
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AppButtonComponent({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  fullWidth = false,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: AppButtonProps) {
  const { tokens } = useAppTheme();
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale();
  const styles = useMemo(
    () => buildButtonStyles(tokens, variant, size, fullWidth),
    [tokens, variant, size, fullWidth]
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPressIn={(e) => {
        scaleIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scaleOut();
        onPressOut?.(e);
      }}
      style={[styles.pressable, animatedStyle, disabled && { opacity: tokens.opacity.disabled }, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={styles.label.color} />
      ) : (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

export const AppButton = memo(AppButtonComponent);
