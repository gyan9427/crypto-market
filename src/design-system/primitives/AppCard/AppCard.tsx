import React, { memo, useMemo } from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/design-system/theme/types';

export type AppCardVariant = 'default' | 'raised' | 'outline';
export type AppCardPadding = 'sm' | 'md' | 'lg' | 'none';

export type AppCardProps = ViewProps & {
  variant?: AppCardVariant;
  padding?: AppCardPadding;
};

function buildCardStyle(
  tokens: ThemeTokens,
  variant: AppCardVariant,
  padding: AppCardPadding
) {
  const pad =
    padding === 'none'
      ? 0
      : padding === 'sm'
        ? tokens.spacing.sm
        : padding === 'lg'
          ? tokens.spacing.lg
          : tokens.semantic.cardPadding;

  const base = {
    borderRadius: tokens.semantic.cardRadius,
    padding: pad,
  };

  switch (variant) {
    case 'raised':
      return {
        ...base,
        backgroundColor: tokens.surface,
        ...tokens.shadows.card,
      };
    case 'outline':
      return {
        ...base,
        backgroundColor: tokens.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: tokens.border,
      };
    default:
      return {
        ...base,
        backgroundColor: tokens.surface,
        ...tokens.shadows.sm,
      };
  }
}

function AppCardComponent({
  variant = 'default',
  padding = 'md',
  style,
  ...rest
}: AppCardProps) {
  const { tokens } = useAppTheme();
  const cardStyle = useMemo(
    () => buildCardStyle(tokens, variant, padding),
    [tokens, variant, padding]
  );
  return <View style={[cardStyle, style]} {...rest} />;
}

export const AppCard = memo(AppCardComponent);
