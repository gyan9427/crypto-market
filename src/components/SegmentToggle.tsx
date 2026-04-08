import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';

interface SegmentToggleProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Omit default horizontal margins (e.g. nested in a card) */
  flush?: boolean;
}

export const SegmentToggle: React.FC<SegmentToggleProps> = ({
  options,
  selectedIndex,
  onSelect,
  flush = false,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens, flush), [tokens, flush]);
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!containerWidth) return;

    const segmentWidthPx = containerWidth / options.length;

    Animated.timing(translateX, {
      toValue: selectedIndex * segmentWidthPx,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, containerWidth, options.length, translateX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: containerWidth / options.length,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={styles.segment}
          onPress={() => onSelect(index)}
          accessibilityRole="button"
          accessibilityLabel={option}
          accessibilityState={{ selected: selectedIndex === index }}
        >
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

function buildStyles(tokens: ThemeTokens, flush: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: tokens.isDark ? tokens.colors.neutral[200] : tokens.colors.neutral[100],
      borderRadius: tokens.borderRadius.button,
      padding: 4,
      position: 'relative',
      marginHorizontal: flush ? 0 : 16,
      marginBottom: flush ? 0 : 16,
    },
    indicator: {
      position: 'absolute',
      left: 4,
      top: 4,
      bottom: 4,
      backgroundColor: tokens.bgElevated,
      borderRadius: tokens.borderRadius.button - 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: tokens.isDark ? 0.35 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segment: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      minHeight: 44,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '500',
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
    },
    segmentTextActive: {
      color: tokens.text,
      fontWeight: '600',
    },
  });
}
