import React, { useCallback, useMemo } from 'react';
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

const INPUT_RADIUS = 12;
const INPUT_MIN_HEIGHT = 52;

/** Removes default browser focus ring on web without breaking RN layout. */
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

/** Chrome/Safari autofill paints a light box — override to match auth shell bg. */
function webAutofillStyle(bg: string, text: string): TextStyle {
  if (Platform.OS !== 'web') return {};
  return {
    backgroundColor: 'transparent',
    // @ts-expect-error web-only CSS properties
    WebkitBoxShadow: `0 0 0 1000px ${bg} inset`,
    WebkitTextFillColor: text,
    caretColor: text,
    transition: 'background-color 99999s ease-out 0s',
  } as TextStyle;
}

type Props = {
  palette: AuthPalette;
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  autoComplete?: 'email' | 'password' | 'off' | 'username';
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

  const inputStyle = useMemo(
    () => [
      styles.input,
      isPassword && styles.inputWithToggle,
      { color: palette.textPrimary },
      WEB_INPUT_FOCUS_RESET,
      webAutofillStyle(palette.inputBg, palette.textPrimary),
    ],
    [isPassword, palette.inputBg, palette.textPrimary]
  );

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
          style={inputStyle}
          accessibilityLabel={label || placeholder || 'Input'}
          underlineColorAndroid="transparent"
          textAlignVertical="center"
          selectionColor={palette.inputBorderFocused}
        />
        {isPassword ? (
          <View style={styles.eyeWrap}>
            <TouchableOpacity
              onPress={() => setInternalReveal((v) => !v)}
              style={styles.eyeHit}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={internalReveal ? 'Hide password' : 'Show password'}
            >
              {internalReveal ? (
                <EyeOff size={20} color={palette.textSecondary} strokeWidth={1.5} />
              ) : (
                <Eye size={20} color={palette.textSecondary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          </View>
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
    marginBottom: 8,
    marginLeft: 1,
    letterSpacing: 0,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: INPUT_MIN_HEIGHT,
    borderRadius: INPUT_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 15,
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
    fontWeight: '400',
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({
          height: INPUT_MIN_HEIGHT - 2,
          lineHeight: '22px',
          paddingTop: 0,
          paddingBottom: 0,
        } as unknown as TextStyle)
      : {
          minHeight: INPUT_MIN_HEIGHT - 2,
          paddingVertical: 14,
        }),
  },
  inputWithToggle: {
    paddingRight: 4,
  },
  eyeWrap: {
    flexShrink: 0,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    backgroundColor: 'transparent',
  },
  eyeHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
