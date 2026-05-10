import React from 'react';
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
  const showSecret = isPassword ? !internalReveal : false;

  return (
    <View style={styles.fieldOuter}>
      {label ? (
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.shell,
          {
            backgroundColor: palette.inputBg,
            borderColor: palette.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
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
          selectionColor={
            Platform.OS === 'android' ? palette.primaryGreen : undefined
          }
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
              <EyeOff size={20} color={palette.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={20} color={palette.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldOuter: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
    letterSpacing: 0.08,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'android' ? 4 : Platform.OS === 'web' ? 2 : 0,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    fontSize: 16,
    letterSpacing: 0.03,
    minHeight: 48,
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
