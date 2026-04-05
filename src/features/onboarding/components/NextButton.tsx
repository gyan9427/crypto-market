import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/src/theme/theme';

export interface NextButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

function NextButtonInner({ label, onPress, style }: NextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    color: colors.surface,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
});

export const NextButton = memo(NextButtonInner);
