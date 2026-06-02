import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export type ScreenProps = SafeAreaViewProps & {
  padded?: boolean;
};

function ScreenComponent({ padded = false, style, edges, children, ...rest }: ScreenProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: tokens.bg,
          paddingHorizontal: padded ? tokens.spacing.screenPadding : 0,
        },
      }),
    [tokens.bg, tokens.spacing.screenPadding, padded]
  );

  return (
    <SafeAreaView style={[styles.root, style]} edges={edges ?? ['left', 'right']} {...rest}>
      {children}
    </SafeAreaView>
  );
}

export const Screen = memo(ScreenComponent);
