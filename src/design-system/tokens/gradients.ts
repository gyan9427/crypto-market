import type { ThemeTokens } from '../theme/types';

export type GradientTokens = {
  carouselStart: string;
  carouselEnd: string;
  splashStart: string;
  splashEnd: string;
  serviceUnavailableStart: string;
  serviceUnavailableEnd: string;
  textBrand: readonly [string, string, string, string];
};

export function getGradientTokens(tokens: ThemeTokens): GradientTokens {
  const primary = tokens.colors.primary[500];
  const accent = tokens.colors.accent[500];
  const accentMid = tokens.colors.primary[600];
  const accentLight = tokens.colors.primary[300];
  if (tokens.isDark) {
    return {
      carouselStart: 'rgba(168,85,247,0.20)',
      carouselEnd: 'rgba(10,10,15,0)',
      splashStart: tokens.colors.ink,
      splashEnd: tokens.colors.ink2,
      serviceUnavailableStart: 'rgba(168,85,247,0.15)',
      serviceUnavailableEnd: tokens.bg,
      textBrand: [accentLight, primary, accentMid, primary] as const,
    };
  }
  return {
    carouselStart: 'rgba(168,85,247,0.12)',
    carouselEnd: 'rgba(255,255,255,0)',
    splashStart: tokens.colors.pageSurface,
    splashEnd: tokens.colors.primary[50],
    serviceUnavailableStart: 'rgba(168,85,247,0.08)',
    serviceUnavailableEnd: tokens.bg,
    textBrand: [accentLight, primary, accentMid, primary] as const,
  };
}
