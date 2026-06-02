import { Platform } from 'react-native';

export type ShadowStyle = Record<string, unknown>;

function shadowNative(
  opacity: number,
  radius: number,
  elevation: number,
  offsetY: number,
  shadowOpacity: number
): ShadowStyle {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity,
    shadowRadius: radius,
    elevation,
  };
}

function shadowWeb(boxShadow: string): ShadowStyle {
  return { boxShadow } as ShadowStyle;
}

export const legacyShadows = {
  sm: Platform.select({
    web: shadowWeb('0px 2px 4px rgba(0,0,0,0.06)'),
    default: shadowNative(1, 4, 2, 2, 0.06),
  }) as ShadowStyle,
  md: Platform.select({
    web: shadowWeb('0px 4px 6px rgba(0,0,0,0.1)'),
    default: shadowNative(1, 6, 4, 4, 0.1),
  }) as ShadowStyle,
  lg: Platform.select({
    web: shadowWeb('0px 8px 16px rgba(0,0,0,0.15)'),
    default: shadowNative(1, 16, 8, 8, 0.15),
  }) as ShadowStyle,
};

export type ThemeShadows = {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  card: ShadowStyle;
  cardHover: ShadowStyle;
  dropdown: ShadowStyle;
  editorial: ShadowStyle;
};

export function buildShadows(isDark: boolean): ThemeShadows {
  if (isDark) {
    const card = Platform.select({
      web: shadowWeb('0 12px 40px rgba(0,0,0,0.35)'),
      default: shadowNative(1, 40, 12, 12, 0.35),
    }) as ShadowStyle;
    const cardHover = Platform.select({
      web: shadowWeb('0 16px 48px rgba(0,0,0,0.42)'),
      default: shadowNative(1, 48, 16, 16, 0.42),
    }) as ShadowStyle;
    const dropdown = Platform.select({
      web: shadowWeb('0 24px 64px rgba(0,0,0,0.50)'),
      default: shadowNative(1, 64, 16, 24, 0.5),
    }) as ShadowStyle;
    const sm = Platform.select({
      web: shadowWeb('0 2px 8px rgba(0,0,0,0.25)'),
      default: shadowNative(1, 8, 4, 2, 0.25),
    }) as ShadowStyle;
    const md = Platform.select({
      web: shadowWeb('0 12px 40px rgba(0,0,0,0.35)'),
      default: shadowNative(1, 40, 10, 12, 0.35),
    }) as ShadowStyle;
    const lg = Platform.select({
      web: shadowWeb('0 16px 48px rgba(0,0,0,0.42)'),
      default: shadowNative(1, 48, 12, 16, 0.42),
    }) as ShadowStyle;
    const editorial = lg;
    return { sm, md, lg, card, cardHover, dropdown, editorial };
  }
  const card = Platform.select({
    web: shadowWeb('0 4px 30px rgba(0,0,0,0.05)'),
    default: shadowNative(1, 30, 4, 4, 0.05),
  }) as ShadowStyle;
  const cardHover = Platform.select({
    web: shadowWeb('0 8px 32px rgba(88,28,135,0.12), 0 2px 6px rgba(0,0,0,0.06)'),
    default: shadowNative(1, 32, 8, 8, 0.12),
  }) as ShadowStyle;
  const dropdown = Platform.select({
    web: shadowWeb('0 16px 48px rgba(88,28,135,0.18), 0 4px 12px rgba(0,0,0,0.08)'),
    default: shadowNative(1, 48, 8, 16, 0.18),
  }) as ShadowStyle;
  const sm = Platform.select({
    web: shadowWeb('0 1px 3px rgba(0,0,0,0.04)'),
    default: shadowNative(1, 3, 2, 1, 0.04),
  }) as ShadowStyle;
  const md = Platform.select({
    web: shadowWeb('0 4px 20px rgba(88,28,135,0.08), 0 1px 3px rgba(0,0,0,0.04)'),
    default: shadowNative(1, 20, 4, 4, 0.08),
  }) as ShadowStyle;
  const lg = Platform.select({
    web: shadowWeb('0 8px 32px rgba(88,28,135,0.12), 0 2px 6px rgba(0,0,0,0.06)'),
    default: shadowNative(1, 32, 6, 8, 0.12),
  }) as ShadowStyle;
  const editorial = cardHover;
  return { sm, md, lg, card, cardHover, dropdown, editorial };
}
