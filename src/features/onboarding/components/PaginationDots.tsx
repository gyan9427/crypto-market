import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated as RNAnimated, Easing, StyleSheet, View } from 'react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface PaginationDotsProps {
  count: number;
  activeIndex: number;
}

const DOT = 6;
const DOT_ACTIVE = 20;
const DURATION = 240;

function PaginationDotsInner({ count, activeIndex }: PaginationDotsProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildPaginationDotsStyles(tokens), [tokens]);
  const c = tokens.colors;

  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={i > 0 ? styles.dotWrap : undefined}>
          <Dot active={i === activeIndex} activeColor={c.primary[500]} inactiveColor={tokens.isDark ? 'rgba(255,255,255,0.20)' : c.neutral[300]} />
        </View>
      ))}
    </View>
  );
}

function Dot({
  active,
  activeColor,
  inactiveColor,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
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
          backgroundColor: active ? activeColor : inactiveColor,
          borderRadius: DOT / 2,
          height: DOT,
        },
      ]}
    />
  );
}

function buildPaginationDotsStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: s.lg,
    },
    dotWrap: {
      marginLeft: s.sm,
    },
  });
}

export const PaginationDots = memo(PaginationDotsInner);
