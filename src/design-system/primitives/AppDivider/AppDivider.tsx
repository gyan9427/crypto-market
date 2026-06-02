import React, { memo, useMemo } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export type AppDividerVariant = 'horizontal' | 'vertical' | 'inset';

export type AppDividerProps = ViewProps & {
  variant?: AppDividerVariant;
};

function AppDividerComponent({
  variant = 'horizontal',
  style,
  ...rest
}: AppDividerProps) {
  const { tokens } = useAppTheme();
  const dividerStyle = useMemo((): ViewStyle => {
    const color = tokens.borderSubtle;
    if (variant === 'vertical') {
      return { width: 1, alignSelf: 'stretch', backgroundColor: color };
    }
    const marginH = variant === 'inset' ? tokens.spacing.md : 0;
    return {
      height: 1,
      alignSelf: 'stretch',
      backgroundColor: color,
      marginHorizontal: marginH,
    };
  }, [tokens, variant]);

  return <View style={[dividerStyle, style]} {...rest} />;
}

export const AppDivider = memo(AppDividerComponent);
