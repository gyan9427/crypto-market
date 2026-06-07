import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Pressable,
  Keyboard,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { AuthPalette } from '@/src/components/auth/authPalette';

type Props = {
  palette: AuthPalette;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  length?: number;
  reducedMotion?: boolean;
};

const CELL_COUNT = 6;

export function OtpInput({
  palette,
  value,
  onChange,
  onComplete,
  disabled = false,
  length = CELL_COUNT,
  reducedMotion = false,
}: Props) {
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const hiddenRef = useRef<TextInput>(null);
  const flashOpacity = useSharedValue(1);

  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const distributeValue = useCallback(
    (text: string) => {
      const cleaned = text.replace(/\D/g, '').slice(0, length);
      onChange(cleaned);
      if (cleaned.length === length) {
        onComplete?.(cleaned);
      }
      const nextFocus = Math.min(cleaned.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
      setFocusedIndex(nextFocus);
    },
    [length, onChange, onComplete]
  );

  const handleCellChange = (index: number, text: string) => {
    if (disabled) return;
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    next[index] = digit;
    const joined = next.join('').replace(/\s/g, '').slice(0, length);
    onChange(joined);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
    if (joined.length === length) {
      onComplete?.(joined);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') return;
    if (value[index]) {
      const next = value.split('');
      next[index] = '';
      onChange(next.join(''));
      return;
    }
    if (index > 0) {
      inputsRef.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
      const next = value.split('');
      next[index - 1] = '';
      onChange(next.join(''));
    }
  };

  useEffect(() => {
    if (!reducedMotion) {
      flashOpacity.value = withTiming(0.5, { duration: 80 }, () => {
        flashOpacity.value = withTiming(1, { duration: 120 });
      });
    }
  }, [value, reducedMotion, flashOpacity]);

  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        const idx = Math.min(value.length, length - 1);
        inputsRef.current[idx]?.focus();
      }}
      accessibilityRole="group"
      accessibilityLabel="Verification code, 6 digits"
    >
      <TextInput
        ref={hiddenRef}
        value={value}
        onChangeText={distributeValue}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        style={styles.hiddenInput}
        editable={!disabled}
        importantForAutofill="yes"
      />
      <Animated.View style={[styles.row, flashStyle]}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            style={[
              styles.cell,
              {
                borderColor: focusedIndex === index ? palette.primary : palette.border,
                backgroundColor: palette.inputBg,
                color: palette.textPrimary,
              },
              focusedIndex === index && styles.cellFocused,
            ]}
            value={digit.trim()}
            onChangeText={(t) => handleCellChange(index, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            onFocus={() => setFocusedIndex(index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!disabled}
            accessibilityLabel={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    maxWidth: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '600',
  },
  cellFocused: {
    borderWidth: 3,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
