/**
 * Compatibility shim — canonical tokens live in src/design-system/.
 * @deprecated Import from '@/src/design-system' for new code.
 */
import { colors, darkColors } from '@/src/design-system/tokens/colors';
import { spacing } from '@/src/design-system/tokens/spacing';
import { borderRadius } from '@/src/design-system/tokens/radii';
import { legacyShadows as shadows } from '@/src/design-system/tokens/shadows';
import { typography } from '@/src/design-system/tokens/typography';

export {
  colors,
  darkColors,
  type AppPalette,
} from '@/src/design-system/tokens/colors';

export { spacing } from '@/src/design-system/tokens/spacing';
export { borderRadius } from '@/src/design-system/tokens/radii';
export { motion, motionDuration, motionEasing } from '@/src/design-system/tokens/motion';
export { zIndex } from '@/src/design-system/tokens/zIndex';
export { opacity } from '@/src/design-system/tokens/opacity';

export {
  typography,
  typographyWithFonts,
  typographyWithFontsForUiLanguage,
} from '@/src/design-system/tokens/typography';

export {
  legacyShadows as shadows,
  buildShadows,
  type ShadowStyle,
} from '@/src/design-system/tokens/shadows';

export type { ThemeTokens } from '@/src/design-system/theme/types';
export { getThemeTokens } from '@/src/design-system/theme/getThemeTokens';
export { getAuthPaletteFromTokens } from '@/src/design-system/theme/authPaletteFromTokens';

/** @deprecated use getThemeTokens + ThemeProvider */
export const semantic = {
  surface: colors.surface,
  backdrop: colors.backdrop,
  cardRadius: borderRadius.lg,
  cardRadiusSmall: borderRadius.md,
  sheetRadius: borderRadius.sheet,
  cardShadow: shadows.sm,
  cardPadding: spacing.md,
  listMarginH: spacing.lg,
  listGap: spacing.sm,
};

export const theme = {
  light: {
    colors,
    spacing,
    borderRadius,
    shadows,
    semantic,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing,
    borderRadius,
    shadows,
    semantic,
    typography,
  },
};

export type Theme = typeof theme.light;
