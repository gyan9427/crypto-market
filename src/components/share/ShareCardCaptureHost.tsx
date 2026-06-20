import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import { NewsShareCard } from '@/src/components/share/NewsShareCard';
import { registerShareCardCapture } from '@/src/share/shareCardCaptureRegistry';
import { SHARE_CARD_MIN_HEIGHT, SHARE_CARD_WIDTH } from '@/src/share/shareCardTheme';
import type { ShareableNews } from '@/src/utils/share';

/**
 * Off-screen host that renders share cards for PNG export via react-native-view-shot.
 * Mount once near the app root (native platforms only).
 */
export function ShareCardCaptureHost() {
  const viewRef = useRef<View>(null);
  const [pendingItem, setPendingItem] = useState<ShareableNews | null>(null);
  const resolveRef = useRef<((uri: string | null) => void) | null>(null);

  const capture = useCallback(async (item: ShareableNews): Promise<string | null> => {
    if (Platform.OS === 'web') return null;

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setPendingItem(item);
    });
  }, []);

  useEffect(() => {
    registerShareCardCapture(capture);
    return () => registerShareCardCapture(null);
  }, [capture]);

  useEffect(() => {
    if (!pendingItem) return;

    let cancelled = false;

    const runCapture = async () => {
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled || !viewRef.current) {
        resolveRef.current?.(null);
        resolveRef.current = null;
        setPendingItem(null);
        return;
      }

      try {
        const uri = await captureRef(viewRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        const dest = `${FileSystem.cacheDirectory}nayft-share-${Date.now()}.png`;
        await FileSystem.copyAsync({ from: uri, to: dest });

        if (!cancelled) {
          resolveRef.current?.(dest);
        }
      } catch {
        resolveRef.current?.(null);
      } finally {
        resolveRef.current = null;
        if (!cancelled) setPendingItem(null);
      }
    };

    void runCapture();
    return () => {
      cancelled = true;
    };
  }, [pendingItem]);

  if (Platform.OS === 'web' || !pendingItem) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.host} collapsable={false}>
      <View ref={viewRef} collapsable={false}>
        <NewsShareCard item={pendingItem} forExport width={SHARE_CARD_WIDTH} height={SHARE_CARD_MIN_HEIGHT} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: -10000,
    top: 0,
    opacity: 1,
  },
});
