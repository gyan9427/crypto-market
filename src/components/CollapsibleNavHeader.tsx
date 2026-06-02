import React from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavHeaderSearch, type NavHeaderSearchProps } from '@/src/components/NavHeaderSearch';
import { useCollapsibleNavHeader } from '@/src/hooks/useCollapsibleNavHeader';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function CollapsibleNavHeader(props: NavHeaderSearchProps) {
  const insets = useSafeAreaInsets();
  const { tokens } = useAppTheme();
  const { headerOffset, maxHeaderOffset } = useCollapsibleNavHeader();

  const onContentLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      maxHeaderOffset.value = height;
    }
  };

  const clipStyle = useAnimatedStyle(() => ({
    height: Math.max(insets.top + maxHeaderOffset.value - headerOffset.value, 0),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -headerOffset.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.outer,
        { backgroundColor: tokens.headerBg, borderBottomColor: tokens.headerBorder },
        clipStyle,
      ]}
    >
      <Animated.View style={contentStyle}>
        <Animated.View style={{ paddingTop: insets.top }} onLayout={onContentLayout}>
          <NavHeaderSearch {...props} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
