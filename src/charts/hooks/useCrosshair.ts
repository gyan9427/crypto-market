import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { xToIdx } from '../services/chartLayout';

export interface UseCrosshairParams {
  totalCandles: number;
  candleWidthPx: { value: number };
  offsetPx: { value: number };
  areaWidth: { value: number };
}

export interface CrosshairState {
  crosshairX: ReturnType<typeof useSharedValue<number>>;
  crosshairY: ReturnType<typeof useSharedValue<number>>;
  crosshairIdx: ReturnType<typeof useDerivedValue<number>>;
  show: (x: number, y: number) => void;
  hide: () => void;
}

export function useCrosshair(params: UseCrosshairParams): CrosshairState {
  const { totalCandles, candleWidthPx, offsetPx, areaWidth } = params;

  const crosshairX = useSharedValue(-1);
  const crosshairY = useSharedValue(-1);

  const crosshairIdx = useDerivedValue(() => {
    'worklet';
    if (crosshairX.value < 0) return -1;
    return xToIdx(
      crosshairX.value,
      totalCandles,
      candleWidthPx.value,
      offsetPx.value,
      areaWidth.value
    );
  }, [totalCandles]);

  const show = (x: number, y: number) => {
    crosshairX.value = x;
    crosshairY.value = y;
  };

  const hide = () => {
    crosshairX.value = -1;
    crosshairY.value = -1;
  };

  return { crosshairX, crosshairY, crosshairIdx, show, hide };
}
