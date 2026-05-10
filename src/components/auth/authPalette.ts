/** Auth-only palette (premium fintech) — complements global ThemeTokens + primary violet */

export type AuthPalette = {
  bg: string;
  primaryGreen: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  /** Quiet focus ring — not accent green on fields */
  inputBorderFocused: string;
  googleSurface: string;
  googleBorder: string;
  errorBg: string;
  errorText: string;
};

export function getAuthPalette(isDark: boolean): AuthPalette {
  if (isDark) {
    return {
      bg: '#0B0F14',
      primaryGreen: '#22C55E',
      inputBg: '#161B22',
      textPrimary: '#F9FAFB',
      textSecondary: '#9CA3AF',
      border: '#222938',
      inputBorderFocused: '#475569',
      googleSurface: '#161B22',
      googleBorder: '#222938',
      errorBg: 'rgba(239, 68, 68, 0.12)',
      errorText: '#FCA5A5',
    };
  }
  /** Light: clean white canvas with high-contrast text and subtle violet accents */
  return {
    bg: '#FFFFFF',
    primaryGreen: '#22C55E',
    inputBg: '#F8FAFC',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    inputBorderFocused: '#8B5CF6',
    googleSurface: '#FFFFFF',
    googleBorder: '#E2E8F0',
    errorBg: 'rgba(254, 226, 226, 0.95)',
    errorText: '#DC2626',
  };
}
