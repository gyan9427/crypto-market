import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AuthPalette } from '@/src/components/auth/authPalette';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { PasswordStrengthMeter } from '@/src/components/auth/PasswordStrengthMeter';
import { usePasswordStrength } from '@/src/hooks/usePasswordStrength';
import { loadZxcvbn } from '@/src/utils/loadZxcvbn';

type Props = {
  palette: AuthPalette;
  password: string;
  onChangePassword: (text: string) => void;
  confirmPassword?: string;
  onChangeConfirmPassword?: (text: string) => void;
  email?: string;
  username?: string;
  passwordLabel: string;
  confirmLabel?: string;
  passwordPlaceholder?: string;
  confirmPlaceholder?: string;
  editable?: boolean;
  isDark?: boolean;
  showConfirm?: boolean;
  mismatchHint?: string;
  shakeToken?: number;
};

export function PasswordStrengthField({
  palette,
  password,
  onChangePassword,
  confirmPassword = '',
  onChangeConfirmPassword,
  email,
  username,
  passwordLabel,
  confirmLabel,
  passwordPlaceholder,
  confirmPlaceholder,
  editable = true,
  isDark = false,
  showConfirm = true,
  mismatchHint,
  shakeToken = 0,
}: Props) {
  const [focused, setFocused] = useState(false);
  const strength = usePasswordStrength(password, { email, username }, { isDark });

  const handleFocus = useCallback(() => {
    setFocused(true);
    loadZxcvbn().catch(() => {});
  }, []);

  const showMeter = focused || password.length > 0;
  const showMismatch =
    showConfirm &&
    Boolean(mismatchHint) &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  return (
    <View>
      <View style={styles.passwordWrap}>
        <AuthInput
          palette={palette}
          label={passwordLabel}
          value={password}
          onChangeText={onChangePassword}
          onFocus={handleFocus}
          secure
          autoCapitalize="none"
          autoComplete="password"
          placeholder={passwordPlaceholder}
          editable={editable}
        />
        <PasswordStrengthMeter
          palette={palette}
          result={strength}
          visible={showMeter}
          shakeToken={shakeToken}
          isDark={isDark}
        />
      </View>

      {showConfirm && confirmLabel && onChangeConfirmPassword ? (
        <View>
          <AuthInput
            palette={palette}
            label={confirmLabel}
            value={confirmPassword}
            onChangeText={onChangeConfirmPassword}
            secure
            autoCapitalize="none"
            autoComplete="password"
            placeholder={confirmPlaceholder}
            editable={editable}
          />
          {showMismatch ? (
            <Text style={[styles.mismatch, { color: palette.errorText }]}>
              {mismatchHint}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  passwordWrap: {
    marginBottom: 0,
  },
  mismatch: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 2,
  },
});
