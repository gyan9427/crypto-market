import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/src/components/Skeleton';
import { usePiStyles } from './piStyles';

interface PiSkeletonProps {
  variant?: 'summary' | 'section';
}

export const PiSkeleton: React.FC<PiSkeletonProps> = ({ variant = 'section' }) => {
  const styles = usePiStyles();

  if (variant === 'summary') {
    return (
      <View style={styles.skeletonCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={64} height={64} borderRadius={32} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Skeleton width="45%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
            <Skeleton width="90%" height={12} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.skeletonCard}>
      <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={12} />
    </View>
  );
};
