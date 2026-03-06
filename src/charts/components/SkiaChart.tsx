import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedReaction, runOnJS, withTiming } from 'react-native-reanimated';
import type { KlineRecord, KlineInterval } from '../types';
import { useKlinesInfinite } from '../hooks/useKlinesInfinite';
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

export interface SkiaChartProps {
  symbol: string;
  interval: KlineInterval;
  style?: object;
}

const SCROLL_LOAD_THRESHOLD = 30;

export function SkiaChart(props: SkiaChartProps) {
  const { symbol, interval, style } = props;

  const [size, setSize] = useState({ width: 0, height: 0 });
  const sizeSv = useSharedValue({ width: 0, height: 0 });

  const { candles, loading, loadingMore, hasMore, loadMore, refetch } = useKlinesInfinite({
    symbol,
    interval,
    limit: 500,
  });

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const { liveCandle } = useRealtimeCandle({
    symbol,
    interval,
    lastCandle,
    onNewCandle: useCallback(() => {
      // New candle sealed - could trigger refetch if needed
    }, []),
  });

  const areaWidth = Math.max(0, size.width - PRICE_AXIS_WIDTH);
  const areaHeight = Math.max(0, size.height - TIME_AXIS_HEIGHT);
  const viewport = useChartViewport({
    totalCandles: candles.length,
    areaWidth,
    areaHeight,
  });

  const totalCandles = candles.length;
  const totalCandlesSv = useSharedValue(totalCandles);

  useEffect(() => {
    totalCandlesSv.value = totalCandles;
  }, [totalCandles, totalCandlesSv]);

  const crosshair = useCrosshair({
    totalCandles,
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

  const [viewportState, setViewportState] = useState({
    visibleStartIdx: 0,
    visibleEndIdx: 0,
    candleWidthPx: BASE_CANDLE_WIDTH,
    offsetPx: 0,
  });

  useAnimatedReaction(
    () => ({
      visibleStartIdx: viewport.visibleStartIdx.value,
      visibleEndIdx: viewport.visibleEndIdx.value,
      candleWidthPx: viewport.candleWidthPx.value,
      offsetPx: viewport.offsetPx.value,
    }),
    (v) => runOnJS(setViewportState)(v)
  );

  useEffect(() => {
    if (viewportState.visibleStartIdx < SCROLL_LOAD_THRESHOLD && hasMore && !loadingMore) {
      loadMore();
    }
  }, [viewportState.visibleStartIdx, hasMore, loadMore, loadingMore]);

  useEffect(() => {
    viewport.resetZoom();
    crosshair.hide();
  }, [symbol, interval]);

  const panGesture = Gesture.Pan()
    .onChange((e) => {
      const totalW = totalCandlesSv.value * viewport.candleWidthPx.value;
      const maxOffset = Math.max(0, totalW - viewport.areaWidth.value);
      const offset = viewport.offsetPx.value - e.changeX;
      viewport.offsetPx.value = Math.max(0, Math.min(maxOffset, offset));
    })
    .activeOffsetX([-10, 10]);

  const pinchGesture = Gesture.Pinch()
    .onChange((e) => {
      const prev = viewport.candleWidthPx.value;
      const next = Math.max(
        MIN_CANDLE_WIDTH,
        Math.min(MAX_CANDLE_WIDTH, prev * e.scale)
      );
      viewport.candleWidthPx.value = next;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      viewport.candleWidthPx.value = withTiming(BASE_CANDLE_WIDTH);
      viewport.offsetPx.value = withTiming(0);
      runOnJS(crosshair.hide)();
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((e) => {
      runOnJS(crosshair.show)(e.x, e.y);
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  );

  if (loading) {
    return <View style={[styles.container, style]} />;
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 200 },
});

export default SkiaChart;
