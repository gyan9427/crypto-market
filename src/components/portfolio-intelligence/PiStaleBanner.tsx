import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePiStyles } from './piStyles';

interface PiStaleBannerProps {
  message: string;
  onRefresh?: () => void;
  refreshLabel?: string;
}

export const PiStaleBanner: React.FC<PiStaleBannerProps> = ({
  message,
  onRefresh,
  refreshLabel = 'Refresh',
}) => {
  const styles = usePiStyles();

  return (
    <View style={styles.staleBanner}>
      <Text style={styles.staleText}>{message}</Text>
      {onRefresh ? (
        <TouchableOpacity onPress={onRefresh} activeOpacity={0.7} style={{ marginTop: 8 }}>
          <Text style={styles.linkText}>{refreshLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
