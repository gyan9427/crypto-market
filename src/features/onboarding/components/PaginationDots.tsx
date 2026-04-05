import React, { memo, useEffect, useRef } from 'react';
import { Animated as RNAnimated, Easing, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/src/theme/theme';

export interface PaginationDotsProps {
  count: number;
  activeIndex: number;
}

const DOT = 8;
const DOT_ACTIVE = 22;
const DURATION = 240;

function PaginationDotsInner({ count, activeIndex }: PaginationDotsProps) {
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={i > 0 ? styles.dotWrap : undefined}>
          <Dot active={i === activeIndex} />
        </View>
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const t = useRef(new RNAnimated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(t, {
      toValue: active ? 1 : 0,
      duration: DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // width interpolation isn't supported by native driver
    }).start();
  }, [active, t]);

  const width = t.interpolate({
    inputRange: [0, 1],
    outputRange: [DOT, DOT_ACTIVE],
  });
  const opacity = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <RNAnimated.View
      style={[
        {
          width,
          opacity,
          backgroundColor: active ? colors.primary[500] : colors.neutral[300],
          borderRadius: DOT / 2,
          height: DOT,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dotWrap: {
    marginLeft: spacing.sm,
  },
});

export const PaginationDots = memo(PaginationDotsInner);
