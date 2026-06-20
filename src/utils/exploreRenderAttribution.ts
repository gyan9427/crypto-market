import { useEffect, useRef } from 'react';
import { recordExploreRender } from './explorePerfMetrics';

type MemoResult = 'OK' | 'FAIL' | 'N/A';

interface AttributionLog {
  component: string;
  coinId?: string;
  why: string;
  changedProps: string[];
  memoResult: MemoResult;
  memoFailReason?: string;
}

function logAttribution(entry: AttributionLog): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const id = entry.coinId ? ` coinId=${entry.coinId}` : '';
  const memo = entry.memoResult === 'N/A'
    ? ''
    : ` memo=${entry.memoResult}${entry.memoFailReason ? ` reason=${entry.memoFailReason}` : ''}`;
  const changed = entry.changedProps.length > 0 ? ` changed=[${entry.changedProps.join(',')}]` : '';
  console.log(`[explore-render] component=${entry.component}${id}${memo}${changed}`);
}

/** Increment render counter and emit structured dev log when props change. */
export function useExploreRenderAttribution<P extends Record<string, unknown>>(
  component: string,
  props: P,
  options?: { coinId?: string; memoCompare?: (prev: P, next: P) => boolean }
): void {
  const prevRef = useRef<P | null>(null);

  useEffect(() => {
    recordExploreRender(component, options?.coinId);

    if (typeof __DEV__ === 'undefined' || !__DEV__) return;

    const prev = prevRef.current;
    if (prev === null) {
      prevRef.current = props;
      logAttribution({
        component,
        coinId: options?.coinId,
        why: 'mount',
        changedProps: [],
        memoResult: 'N/A',
      });
      return;
    }

    const changedProps: string[] = [];
    for (const key of Object.keys(props)) {
      if (prev[key as keyof P] !== props[key as keyof P]) {
        changedProps.push(key);
      }
    }

    let memoResult: MemoResult = 'N/A';
    let memoFailReason: string | undefined;
    if (options?.memoCompare) {
      memoResult = options.memoCompare(prev, props) ? 'OK' : 'FAIL';
      if (memoResult === 'FAIL') {
        memoFailReason = changedProps.join('|') || 'unknown';
      }
    }

    if (changedProps.length > 0 || memoResult === 'FAIL') {
      logAttribution({
        component,
        coinId: options?.coinId,
        why: changedProps.length > 0 ? 'props-changed' : 'parent-rerender',
        changedProps,
        memoResult,
        memoFailReason,
      });
    }

    prevRef.current = props;
  });
}
