/** Auth palette — derived from ThemeTokens for DS migration compatibility */

import { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';
import { getThemeTokens } from '@/src/design-system/theme/getThemeTokens';

export type AuthPalette = {
  bg: string;
  primary: string;
  /** @deprecated alias kept for backwards compatibility; use `primary` */
  primaryGreen: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  inputBorderFocused: string;
  googleSurface: string;
  googleBorder: string;
  errorBg: string;
  errorText: string;
};

export function getAuthPalette(isDark: boolean): AuthPalette {
  return getAuthPaletteFromTokens(getThemeTokens(isDark));
}
