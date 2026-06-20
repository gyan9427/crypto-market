import React, { memo, useMemo } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AppText } from '../AppText';
import { getMarketUiPalette } from '@/src/theme/chartPalette';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type AppPillProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

function buildPillStyles(tokens: ThemeTokens, selected: boolean) {
  const ui = getMarketUiPalette(tokens);
  return StyleSheet.create({
    pill: {
      paddingVertical: tokens.spacing.xs + 1,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.borderRadius.pill,
      borderWidth: selected ? 1.5 : 1,
      borderColor: selected ? tokens.colors.primary[500] : tokens.borderStrong,
      backgroundColor: selected ? ui.pillSelectedBg : tokens.surfaceMuted,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}

function AppPillComponent({
  label,
  selected = false,
  style,
  ...rest
}: AppPillProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () => buildPillStyles(tokens, selected),
    [tokens, selected]
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.pill, style]}
      {...rest}
    >
      <AppText
        variant="caption"
        color={selected ? 'link' : 'muted'}
        style={selected ? { fontWeight: tokens.typography.fontWeights.semibold } : undefined}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export const AppPill = memo(AppPillComponent);
