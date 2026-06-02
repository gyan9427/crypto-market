import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { AppText } from '@/src/design-system/primitives/AppText';

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
      duration: tokens.motion.duration.normal,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, containerWidth, options.length, translateX, tokens.motion.duration.normal]);

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
          <AppText
            variant="body-s"
            color={selectedIndex === index ? 'link' : 'muted'}
            style={[
              styles.segmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {option}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

function buildStyles(tokens: ThemeTokens, flush: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: tokens.surfaceMuted,
      borderRadius: tokens.borderRadius.button,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      padding: 3,
      position: 'relative',
      marginHorizontal: flush ? 0 : 16,
      marginBottom: flush ? 0 : 16,
    },
    indicator: {
      position: 'absolute',
      left: 3,
      top: 3,
      bottom: 3,
      backgroundColor: tokens.bgElevated,
      borderRadius: tokens.borderRadius.button - 2,
      borderWidth: 1,
      borderColor: tokens.border,
      shadowColor: tokens.isDark ? '#000' : 'rgba(88,28,135,0.15)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: tokens.isDark ? 0.35 : 0.12,
      shadowRadius: 3,
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
      fontSize: tokens.typography.fontSizes.base,
      fontWeight: tokens.typography.fontWeights.medium,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
      color: tokens.textMuted,
      letterSpacing: tokens.typography.letterSpacing.button,
    },
    segmentTextActive: {
      color: tokens.colors.primary[tokens.isDark ? 400 : 600],
      fontWeight: tokens.typography.fontWeights.semibold,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
  });
}
