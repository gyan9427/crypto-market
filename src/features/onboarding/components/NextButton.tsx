import React, { memo, useMemo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface NextButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

function NextButtonInner({ label, onPress, style }: NextButtonProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildNextButtonStyles(tokens), [tokens]);

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

function buildNextButtonStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  return StyleSheet.create({
    btn: {
      backgroundColor: c.primary[600],
      paddingVertical: s.md,
      paddingHorizontal: s.xl,
      borderRadius: br.button,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 200,
    },
    pressed: {
      opacity: 0.92,
    },
    label: {
      color: c.surface,
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
    },
  });
}

export const NextButton = memo(NextButtonInner);
