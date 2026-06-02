import React, { memo, useMemo } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type AppInputProps = TextInputProps & {
  error?: boolean;
};

function buildInputStyles(tokens: ThemeTokens, error: boolean) {
  return StyleSheet.create({
    wrap: {
      width: '100%',
    },
    input: {
      backgroundColor: tokens.inputBg,
      borderWidth: 1.5,
      borderColor: error ? tokens.colors.danger[500] : tokens.inputBorder,
      borderRadius: tokens.borderRadius.sm,
      paddingVertical: tokens.spacing.sm + 2,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.typography.fontSizes.md,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sans,
      minHeight: 44,
    },
  });
}

function AppInputComponent({ error = false, style, ...rest }: AppInputProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () => buildInputStyles(tokens, error),
    [tokens, error]
  );
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={tokens.colors.muted2}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export const AppInput = memo(AppInputComponent);
