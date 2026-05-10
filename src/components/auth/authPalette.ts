/** Auth-only palette — NAYFT design system with purple-first brand identity */

export type AuthPalette = {
  bg: string;
  /** Primary action color (purple) — replaces legacy primaryGreen */
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
  if (isDark) {
    return {
      bg: '#0a0a0a',
      primary: '#a855f7',
      primaryGreen: '#a855f7',
      inputBg: '#171717',
      textPrimary: '#f5f5f5',
      textSecondary: '#a3a3a3',
      border: 'rgba(255,255,255,0.08)',
      inputBorderFocused: '#a855f7',
      googleSurface: '#171717',
      googleBorder: 'rgba(255,255,255,0.08)',
      errorBg: 'rgba(239,68,68,0.12)',
      errorText: '#fca5a5',
    };
  }
  return {
    bg: '#f4f4f5',
    primary: '#a855f7',
    primaryGreen: '#a855f7',
    inputBg: '#fafafa',
    textPrimary: '#1a0a2e',
    textSecondary: '#525252',
    border: '#e5e5e5',
    inputBorderFocused: '#a855f7',
    googleSurface: '#ffffff',
    googleBorder: '#e5e5e5',
    errorBg: 'rgba(239,68,68,0.10)',
    errorText: '#dc2626',
  };
}
