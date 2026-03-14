import {
  colors,
  spacing,
  borderRadius,
  typography,
  semantic,
} from './theme';

/** Card preset (matches Portfolio eventRow, accountCard) */
export const cardBase = {
  backgroundColor: semantic.surface,
  borderRadius: semantic.cardRadius,
  padding: semantic.cardPadding,
  ...semantic.cardShadow,
};

/** Card small (badges, list items) */
export const cardSmall = {
  backgroundColor: semantic.surface,
  borderRadius: semantic.cardRadiusSmall,
  padding: spacing.sm,
  ...semantic.cardShadow,
};

/** Section title */
export const sectionTitle = {
  fontSize: typography.fontSizes.md,
  fontWeight: typography.fontWeights.semibold,
  color: colors.neutral[800],
  marginBottom: spacing.sm,
};

/** Input base */
export const inputBase = {
  borderWidth: 1,
  borderColor: colors.neutral[200],
  borderRadius: semantic.cardRadiusSmall,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  fontSize: typography.fontSizes.base,
  color: colors.neutral[800],
  backgroundColor: colors.neutral[50],
};

/** Button primary */
export const buttonPrimary = {
  backgroundColor: colors.primary[500],
  borderRadius: borderRadius.button,
  paddingVertical: spacing.sm,
  alignItems: 'center' as const,
};

/** Button primary text */
export const buttonPrimaryText = {
  color: colors.surface,
  fontWeight: typography.fontWeights.semibold,
  fontSize: typography.fontSizes.base,
};
