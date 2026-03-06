import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { colors, borderRadius } from '../theme/theme';

interface SegmentToggleProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const SegmentToggle: React.FC<SegmentToggleProps> = ({
  options,
  selectedIndex,
  onSelect,
}) => {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.button,
    padding: 4,
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: '#fff',
    borderRadius: borderRadius.button - 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    color: colors.neutral[500],
  },
  segmentTextActive: {
    color: colors.neutral[800],
    fontWeight: '600',
  },
});
