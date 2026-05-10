import React, { useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import type { AuthPalette } from '@/src/components/auth/authPalette';

const WEB_INPUT_FOCUS_RESET: TextStyle =
  Platform.OS === 'web'
    ? ({
        outlineWidth: 0,
        outlineStyle: 'none',
        outlineOffset: 0,
        outlineColor: 'transparent',
        boxShadow: 'none',
      } as unknown as TextStyle)
    : {};

type Props = {
  palette: AuthPalette;
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  autoComplete?: 'email' | 'password' | 'off';
  editable?: boolean;
};

export function AuthInput({
  palette,
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  editable = true,
}: Props) {
  const isPassword = Boolean(secure);
  const [internalReveal, setInternalReveal] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const showSecret = isPassword ? !internalReveal : false;

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const borderColor = focused ? palette.inputBorderFocused : palette.border;
  const focusShadow =
    focused && Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 3px rgba(168,85,247,0.15)' } as unknown as TextStyle)
      : {};

  return (
    <View style={styles.fieldOuter}>
      {label ? (
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.shell,
          focusShadow,
          {
            backgroundColor: palette.inputBg,
            borderColor,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={palette.textSecondary}
          editable={editable}
          secureTextEntry={isPassword ? showSecret : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={keyboardType !== 'email-address'}
          autoComplete={autoComplete}
          style={[styles.input, { color: palette.textPrimary }, WEB_INPUT_FOCUS_RESET]}
          accessibilityLabel={label || placeholder || 'Input'}
          underlineColorAndroid="transparent"
          textAlignVertical="center"
          selectionColor={palette.inputBorderFocused}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setInternalReveal((v) => !v)}
            style={styles.eyeHit}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={internalReveal ? 'Hide password' : 'Show password'}
          >
            {internalReveal ? (
              <EyeOff size={18} color={palette.textSecondary} strokeWidth={1.5} />
            ) : (
              <Eye size={18} color={palette.textSecondary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldOuter: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 1,
    letterSpacing: 0,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 2 : 0,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 14,
    letterSpacing: 0,
    minHeight: 44,
    fontWeight: '400',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeHit: {
    paddingLeft: 10,
    paddingVertical: 4,
    justifyContent: 'center',
  },
});
