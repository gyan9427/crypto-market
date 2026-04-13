import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ListRenderItem,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_OPTIONS,
  type LanguageOption,
  type SupportedLanguage,
} from '@/src/constants/languages';
import type { ThemeTokens } from '@/src/theme/theme';

export type LanguagePickerSheetProps = {
  tokens: ThemeTokens;
  currentLanguage: SupportedLanguage;
  /** Must call `setLanguage` only; parent may dismiss the sheet after await. */
  onSelectLanguage: (code: SupportedLanguage) => Promise<void>;
};

type RowProps = {
  item: LanguageOption;
  selected: boolean;
  tokens: ThemeTokens;
  onPress: () => void;
};

const LanguageRow = React.memo(function LanguageRow({
  item,
  selected,
  tokens,
  onPress,
}: RowProps) {
  const s = useMemo(() => rowStyles(tokens), [tokens]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        pressed && s.rowPressed,
        selected && (tokens.isDark ? s.rowSelectedDark : s.rowSelectedLight),
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.englishLabel}, ${item.label}`}
      accessibilityState={{ selected }}
    >
      <View style={s.rowTextWrap}>
        <Text style={s.nativeLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={s.englishLabel} numberOfLines={1}>
          {item.englishLabel}
        </Text>
      </View>
      {selected ? (
        <Text style={s.check} accessibilityElementsHidden>
          ✓
        </Text>
      ) : (
        <View style={s.radioOuter} accessibilityElementsHidden>
          <View style={s.radioInner} />
        </View>
      )}
    </Pressable>
  );
});

export const LanguagePickerSheet = forwardRef<BottomSheetModal, LanguagePickerSheetProps>(
  function LanguagePickerSheet({ tokens, currentLanguage, onSelectLanguage }, ref) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['58%', '88%'], []);

    const sheetStyles = useMemo(() => buildSheetStyles(tokens), [tokens]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.45}
        />
      ),
      []
    );

    const handleSelect = useCallback(
      async (code: SupportedLanguage) => {
        await onSelectLanguage(code);
      },
      [onSelectLanguage]
    );

    const renderItem: ListRenderItem<LanguageOption> = useCallback(
      ({ item }) => (
        <LanguageRow
          item={item}
          selected={item.code === currentLanguage}
          tokens={tokens}
          onPress={() => void handleSelect(item.code)}
        />
      ),
      [currentLanguage, tokens, handleSelect]
    );

    const keyExtractor = useCallback((item: LanguageOption) => item.code, []);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={sheetStyles.handle}
        backgroundStyle={sheetStyles.sheetBg}
      >
        <View style={[sheetStyles.header, { paddingBottom: tokens.spacing.sm }]}>
          <Text style={sheetStyles.title}>{t('profile.languagePickerTitle')}</Text>
        </View>
        <BottomSheetFlatList<LanguageOption>
          data={[...LANGUAGE_OPTIONS]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: tokens.spacing.md,
            paddingBottom: Math.max(insets.bottom, tokens.spacing.md),
          }}
          initialNumToRender={12}
          windowSize={5}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
    );
  }
);

function rowStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.sm,
      borderRadius: tokens.semantic.cardRadius,
      marginBottom: tokens.spacing.xs,
    },
    rowPressed: {
      opacity: 0.85,
    },
    rowSelectedLight: {
      backgroundColor: tokens.colors.primary[50],
    },
    rowSelectedDark: {
      backgroundColor: 'rgba(168, 85, 247, 0.12)',
    },
    rowTextWrap: {
      flex: 1,
      marginRight: tokens.spacing.md,
    },
    nativeLabel: {
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    englishLabel: {
      fontSize: tokens.typography.fontSizes.xs,
      color: tokens.textMuted,
      marginTop: 2,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    check: {
      fontSize: tokens.typography.fontSizes.lg,
      color: tokens.colors.primary[600],
      fontWeight: tokens.typography.fontWeights.bold,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: tokens.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 0,
      height: 0,
    },
  });
}

function buildSheetStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    sheetBg: {
      backgroundColor: tokens.bgElevated,
    },
    handle: {
      backgroundColor: tokens.colors.neutral[300],
      width: 40,
    },
    header: {
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.xs,
    },
    title: {
      fontSize: tokens.typography.fontSizes.lg,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
  });
}
