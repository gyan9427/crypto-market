import { useCallback, useEffect } from 'react';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { BASE_CANDLE_WIDTH } from '../constants';
import { getVisibleRange } from '../services/chartLayout';

export interface UseChartViewportParams {
  totalCandles: number;
  areaWidth: number;
  areaHeight: number;
}

export interface ChartViewport {
  candleWidthPx: ReturnType<typeof useSharedValue<number>>;
  offsetPx: ReturnType<typeof useSharedValue<number>>;
  areaWidth: ReturnType<typeof useSharedValue<number>>;
  areaHeight: ReturnType<typeof useSharedValue<number>>;
  visibleStartIdx: ReturnType<typeof useDerivedValue<number>>;
  visibleEndIdx: ReturnType<typeof useDerivedValue<number>>;
  resetZoom: () => void;
}

export function useChartViewport(params: UseChartViewportParams): ChartViewport {
  const { totalCandles, areaWidth, areaHeight } = params;

  const candleWidthPx = useSharedValue(BASE_CANDLE_WIDTH);
  const offsetPx = useSharedValue(0);
  const areaWidthSv = useSharedValue(areaWidth);
  const areaHeightSv = useSharedValue(areaHeight);

  useEffect(() => {
    areaWidthSv.value = areaWidth;
    areaHeightSv.value = areaHeight;
  }, [areaWidth, areaHeight, areaWidthSv, areaHeightSv]);

  const visibleStartIdx = useDerivedValue(() => {
    'worklet';
    const [start] = getVisibleRange(
      totalCandles,
      candleWidthPx.value,
      offsetPx.value,
      areaWidthSv.value
    );
    return start;
  }, [totalCandles]);

  const visibleEndIdx = useDerivedValue(() => {
    'worklet';
    const [, end] = getVisibleRange(
      totalCandles,
      candleWidthPx.value,
      offsetPx.value,
      areaWidthSv.value
    );
    return end;
  }, [totalCandles]);

  const resetZoom = useCallback(() => {
    candleWidthPx.value = BASE_CANDLE_WIDTH;
    offsetPx.value = 0;
  }, [candleWidthPx, offsetPx]);

  return {
    candleWidthPx,
    offsetPx,
    areaWidth: areaWidthSv,
    areaHeight: areaHeightSv,
    visibleStartIdx,
    visibleEndIdx,
    resetZoom,
  };
}
