import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { List, Table } from 'lucide-react-native';
import { colors, borderRadius } from '../theme/theme';

interface ViewToggleProps {
  selectedView: 'list' | 'table';
  onSelect: (view: 'list' | 'table') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  selectedView,
  onSelect,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const selectedIndex = selectedView === 'list' ? 0 : 1;

  useEffect(() => {
    if (!containerWidth) return;

    const segmentWidthPx = containerWidth / 2;

    Animated.timing(translateX, {
      toValue: selectedIndex * segmentWidthPx,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, containerWidth, translateX]);

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
              width: containerWidth / 2,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      <TouchableOpacity
        style={styles.segment}
        onPress={() => onSelect('list')}
        accessibilityRole="button"
        accessibilityLabel="List view"
        accessibilityState={{ selected: selectedView === 'list' }}
      >
        <List size={16} color={selectedView === 'list' ? colors.neutral[800] : colors.neutral[500]} />
        <Text
          style={[
            styles.segmentText,
            selectedView === 'list' && styles.segmentTextActive,
          ]}
        >
          List
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.segment}
        onPress={() => onSelect('table')}
        accessibilityRole="button"
        accessibilityLabel="Table view"
        accessibilityState={{ selected: selectedView === 'table' }}
      >
        <Table size={16} color={selectedView === 'table' ? colors.neutral[800] : colors.neutral[500]} />
        <Text
          style={[
            styles.segmentText,
            selectedView === 'table' && styles.segmentTextActive,
          ]}
        >
          Table
        </Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    gap: 6,
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
