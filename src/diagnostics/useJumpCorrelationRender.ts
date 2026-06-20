import { useEffect, useRef } from 'react';
import { jumpAuditRender } from './jumpCorrelationAudit';

export function useJumpCorrelationRender<P extends Record<string, unknown>>(
  component: string,
  props: P,
  stateKeys: string[] = []
): void {
  const prevProps = useRef<P | null>(null);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const prev = prevProps.current;
    const changedProps: string[] = [];

    if (prev) {
      for (const key of Object.keys(props)) {
        if (prev[key as keyof P] !== props[key as keyof P]) {
          changedProps.push(key);
        }
      }
    }

    jumpAuditRender(component, {
      why: prev ? (changedProps.length > 0 ? 'props-changed' : 'parent-rerender') : 'mount',
      changedProps,
      changedState: stateKeys.length > 0 ? stateKeys : undefined,
    });

    prevProps.current = props;
  });
}
