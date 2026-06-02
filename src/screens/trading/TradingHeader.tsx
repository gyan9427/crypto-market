import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { AppText } from '@/src/design-system/primitives/AppText';
import type { ThemeTokens } from '@/src/theme/theme';

type TradingHeaderStyles = {
  header: object;
  iconBtn: object;
  coinInfo: object;
  coinName: object;
  coinLabel: object;
};

type Props = {
  coinName: string;
  coinSymbol: string;
  tokens: ThemeTokens;
  styles: TradingHeaderStyles;
  topInset: number;
  onBack: () => void;
  onAlerts?: () => void;
};

export function TradingHeader({
  coinName,
  coinSymbol,
  tokens,
  styles: S,
  topInset,
  onBack,
  onAlerts,
}: Props) {
  return (
    <View style={[S.header, { paddingTop: topInset + 8 }]}>
      <TouchableOpacity style={S.iconBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={20} color={tokens.text} />
      </TouchableOpacity>
      <View style={S.coinInfo}>
        <AppText variant="caption" color="muted" style={S.coinName}>
          {coinName}
        </AppText>
        <AppText variant="heading-s" color="strong" style={S.coinLabel}>
          {coinSymbol}
        </AppText>
      </View>
      {onAlerts ? (
        <TouchableOpacity style={S.iconBtn} onPress={onAlerts} accessibilityRole="button" accessibilityLabel="Alerts">
          <Bell size={20} color={tokens.text} />
        </TouchableOpacity>
      ) : (
        <View style={S.iconBtn} />
      )}
    </View>
  );
}
