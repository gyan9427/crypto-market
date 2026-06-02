import type { AuthPalette } from '@/src/components/auth/authPalette';
import type { ThemeTokens } from './types';

/** Maps ThemeTokens to the legacy AuthPalette shape for gradual auth migration. */
export function getAuthPaletteFromTokens(tokens: ThemeTokens): AuthPalette {
  const primary = tokens.colors.primary[500];
  return {
    bg: tokens.bg,
    primary,
    primaryGreen: primary,
    inputBg: tokens.inputBg,
    textPrimary: tokens.textStrong,
    textSecondary: tokens.textMuted,
    border: tokens.border,
    inputBorderFocused: tokens.borderFocus,
    googleSurface: tokens.surface,
    googleBorder: tokens.border,
    errorBg: tokens.isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.10)',
    errorText: tokens.isDark ? tokens.colors.error[300] : tokens.colors.error[600],
  };
}
