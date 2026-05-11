import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedReaction, runOnJS, withTiming, withDecay } from 'react-native-reanimated';
import type { KlineRecord, KlineInterval } from '../types';
import { useKlinesInfinite, dedupeAndSort } from '../hooks/useKlinesInfinite';
import { useRealtimeCandle } from '../hooks/useRealtimeCandle';
import { useChartViewport } from '../hooks/useChartViewport';
import { useCrosshair } from '../hooks/useCrosshair';
import { SkiaCanvas } from '../rendering/SkiaCanvas';
import {
  PRICE_AXIS_WIDTH,
  TIME_AXIS_HEIGHT,
  BASE_CANDLE_WIDTH,
  MIN_CANDLE_WIDTH,
  MAX_CANDLE_WIDTH,
} from '../constants';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { getChartUIPalette } from '@/src/theme/chartPalette';
import { ChartUiProvider } from '../ChartUiContext';

export interface SkiaChartProps {
  symbol: string;
  interval: KlineInterval;
  exchange?: string;
  style?: object;
}

const SCROLL_LOAD_THRESHOLD = 30;

export function SkiaChart(props: SkiaChartProps) {
  const { symbol, interval, exchange, style } = props;

  const { tokens } = useAppTheme();
  const chartUi = useMemo(() => getChartUIPalette(tokens), [tokens]);
  const styles = useMemo(() => buildSkiaChartStyles(tokens), [tokens]);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const sizeSv = useSharedValue({ width: 0, height: 0 });

  const { candles, loading, hasMore, error, loadMore, refetch, setCandles } = useKlinesInfinite({
    symbol,
    interval,
    limit: 500,
    exchange,
  });

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  // P0-11: wire onNewCandle to append the sealed candle to state
  const handleNewCandle = useCallback(
    (sealed: KlineRecord) => {
      setCandles((prev) => dedupeAndSort([...prev, sealed]));
    },
    [setCandles]
  );

  // Issue 13: merge gap-fill candles fetched after a WebSocket reconnect
  const handleGapFill = useCallback(
    (gapCandles: KlineRecord[]) => {
      setCandles((prev) => dedupeAndSort([...prev, ...gapCandles]));
    },
    [setCandles]
  );

  const { liveCandle } = useRealtimeCandle({
    symbol,
    interval,
    lastCandle,
    onNewCandle: handleNewCandle,
    onGapFill: handleGapFill,
  });

  const areaWidth = Math.max(0, size.width - PRICE_AXIS_WIDTH);
  const areaHeight = Math.max(0, size.height - TIME_AXIS_HEIGHT);
  const viewport = useChartViewport({
    totalCandles: candles.length,
    areaWidth,
    areaHeight,
  });

  const totalCandlesSv = useSharedValue(candles.length);
  useEffect(() => {
    totalCandlesSv.value = candles.length;
  }, [candles.length, totalCandlesSv]);

  const crosshair = useCrosshair({
    totalCandles: candles.length,
    candleWidthPx: viewport.candleWidthPx,
    offsetPx: viewport.offsetPx,
    areaWidth: viewport.areaWidth,
  });

  useAnimatedReaction(
    () => sizeSv.value,
    (v) => runOnJS(setSize)(v)
  );

  const [liveCandleState, setLiveCandleState] = useState<KlineRecord | null>(null);
  useAnimatedReaction(
    () => liveCandle.value,
    (v) => runOnJS(setLiveCandleState)(v)
  );

  // P0-10: only cross to JS thread when the visible candle range or candle width
  // changes — not on every sub-pixel offsetPx update. Quantize offsetPx to the
  // nearest candle slot so a new React render fires at most once per candle scrolled.
  const [viewportState, setViewportState] = useState({
    visibleStartIdx: 0,
    visibleEndIdx: 0,
    candleWidthPx: BASE_CANDLE_WIDTH,
    offsetPx: 0,
  });

  useAnimatedReaction(
    () => {
      'worklet';
      const cw = viewport.candleWidthPx.value;
      return {
        visibleStartIdx: viewport.visibleStartIdx.value,
        visibleEndIdx: viewport.visibleEndIdx.value,
        // Quantize to nearest 0.5px for candle width, nearest slot for offset
        candleWidthPx: Math.round(cw * 2) / 2,
        offsetPx: Math.round(viewport.offsetPx.value / Math.max(1, cw)) * Math.round(cw),
      };
    },
    (current, previous) => {
      'worklet';
      if (
        !previous ||
        current.visibleStartIdx !== previous.visibleStartIdx ||
        current.visibleEndIdx !== previous.visibleEndIdx ||
        current.candleWidthPx !== previous.candleWidthPx ||
        current.offsetPx !== previous.offsetPx
      ) {
        runOnJS(setViewportState)(current);
      }
    }
  );

  // P0-18: add viewport and crosshair to deps — both are stable refs, no runtime cost
  useEffect(() => {
    viewport.resetZoom();
    crosshair.hide();
  }, [symbol, interval, viewport, crosshair]);

  const panGesture = Gesture.Pan()
    .onChange((e) => {
      'worklet';
      const totalW = totalCandlesSv.value * viewport.candleWidthPx.value;
      const maxOffset = Math.max(0, totalW - viewport.areaWidth.value);
      const offset = viewport.offsetPx.value - e.changeX;
      viewport.offsetPx.value = Math.max(0, Math.min(maxOffset, offset));
    })
    // Issue 10: apply momentum decay so the chart coasts to a stop after finger lift
    .onEnd((e) => {
      'worklet';
      const totalW = totalCandlesSv.value * viewport.candleWidthPx.value;
      const maxOffset = Math.max(0, totalW - viewport.areaWidth.value);
      viewport.offsetPx.value = withDecay({
        velocity: -e.velocityX,   // negate: leftward swipe → increasing offset
        clamp: [0, maxOffset],
      });
      if (viewport.visibleStartIdx.value < SCROLL_LOAD_THRESHOLD) {
        runOnJS(loadMore)();
      }
    })
    .activeOffsetX([-10, 10]);

  // P0-9: fix pinch zoom focal point — zoom anchors to where the fingers are placed
  const pinchGesture = Gesture.Pinch()
    .onChange((e) => {
      'worklet';
      const prev = viewport.candleWidthPx.value;
      const next = Math.max(MIN_CANDLE_WIDTH, Math.min(MAX_CANDLE_WIDTH, prev * e.scale));
      const ratio = next / prev;
      // Adjust offset so the focal point stays fixed on screen
      viewport.offsetPx.value = e.focalX - (e.focalX - viewport.offsetPx.value) * ratio;
      viewport.candleWidthPx.value = next;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      viewport.candleWidthPx.value = withTiming(BASE_CANDLE_WIDTH);
      viewport.offsetPx.value = withTiming(0);
      runOnJS(crosshair.hide)();
    });

  // Issue 9: long-press shows crosshair; onTouchesMove tracks finger; onFinalize always hides
  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart((e) => {
      'worklet';
      runOnJS(crosshair.show)(e.x, e.y);
    })
    .onTouchesMove((e) => {
      'worklet';
      if (e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        runOnJS(crosshair.show)(t.x, t.y);
      }
    })
    .onEnd(() => {
      'worklet';
      runOnJS(crosshair.hide)();
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(crosshair.hide)();
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    Gesture.Exclusive(doubleTapGesture, longPressGesture)
  );

  if (loading) {
    return (
      <ChartUiProvider value={chartUi}>
        <View style={[styles.container, styles.skeleton, style]} />
      </ChartUiProvider>
    );
  }

  if (error) {
    return (
      <ChartUiProvider value={chartUi}>
        <View style={[styles.container, styles.errorContainer, style]}>
          <Text style={styles.errorText}>Failed to load chart</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ChartUiProvider>
    );
  }

  return (
    <ChartUiProvider value={chartUi}>
      <GestureDetector gesture={composed}>
        <View
          style={[styles.container, style]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            sizeSv.value = { width, height };
          }}
        >
          <SkiaCanvas
            candles={candles}
            liveCandle={liveCandleState ?? lastCandle}
            viewport={viewport}
            viewportState={viewportState}
            crosshair={crosshair}
            interval={interval}
            width={size.width}
            height={size.height}
          />
        </View>
      </GestureDetector>
    </ChartUiProvider>
  );
}


function buildSkiaChartStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      minHeight: 200,
      backgroundColor: tokens.surfaceMuted,
    },
    skeleton: {
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      color: tokens.textMuted,
      fontSize: 13,
    },
    retryButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    },
    retryText: {
      color: tokens.text,
      fontSize: 13,
      fontWeight: '500',
    },
  });
}

export default SkiaChart;
