import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeSyntheticEvent, TextInputPressEventData } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, shadows } from '../theme/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  editable?: boolean;
  onPressIn?: (event: NativeSyntheticEvent<TextInputPressEventData>) => void;
  /** When provided with editable=false, the whole bar acts as a button (navigates to search). Prevents focus on the input so user doesn't think they can type. */
  onPress?: () => void;
  /** `header`: tighter margins for use inside navigation headerTitle */
  variant?: 'default' | 'header';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
  onFocus,
  editable = true,
  onPressIn,
  onPress,
  variant = 'default',
}) => {
  const isFakeBar = !editable && onPress != null;
  const content = (
    <View style={[styles.container, variant === 'header' ? styles.containerHeader : undefined]}>
      <Search size={20} color={colors.neutral[400]} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        editable={editable}
        onPressIn={isFakeBar ? undefined : onPressIn}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        accessibilityLabel="Search input"
        accessibilityRole="search"
        pointerEvents={isFakeBar ? 'none' : 'auto'}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearButton}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={colors.neutral[400]} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isFakeBar) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Open search">
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadows.sm,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.neutral[800],
    padding: 0,
  },
  clearButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerHeader: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
