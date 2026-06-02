import React, { memo, useMemo } from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type AppSurfaceVariant = 'default' | 'muted' | 'elevated' | 'inverse';

export type AppSurfaceProps = ViewProps & {
  variant?: AppSurfaceVariant;
};

function surfaceColors(tokens: ThemeTokens, variant: AppSurfaceVariant) {
  switch (variant) {
    case 'muted':
      return { backgroundColor: tokens.surfaceMuted };
    case 'elevated':
      return { backgroundColor: tokens.bgElevated };
    case 'inverse':
      return {
        backgroundColor: tokens.isDark ? tokens.colors.neutral[900] : tokens.heading,
      };
    default:
      return { backgroundColor: tokens.surface };
  }
}

function AppSurfaceComponent({
  variant = 'default',
  style,
  ...rest
}: AppSurfaceProps) {
  const { tokens } = useAppTheme();
  const base = useMemo(
    () => surfaceColors(tokens, variant),
    [tokens, variant]
  );
  return <View style={[base, style]} {...rest} />;
}

export const AppSurface = memo(AppSurfaceComponent);
