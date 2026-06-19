/** Intern flat sparkline pairs [v, v] to avoid repeated allocations. */
const flatSparklineIntern = new Map<number, number[]>();

export function internFlatSparkline(value: number): number[] {
  if (!Number.isFinite(value)) return [0, 0];
  let cached = flatSparklineIntern.get(value);
  if (!cached) {
    cached = [value, value];
    flatSparklineIntern.set(value, cached);
  }
  return cached;
}

export function sparklineValuesEqual(
  a: number[] | undefined,
  b: number[] | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Return `prev` when numeric sequences match; otherwise return normalized `next`.
 * Flat two-point arrays are interned.
 */
export function preserveSparklineReference(
  prev: number[] | undefined,
  next: number[] | undefined
): number[] | undefined {
  if (next === undefined) return prev;
  if (sparklineValuesEqual(prev, next)) return prev ?? next;
  if (next.length === 2 && next[0] === next[1] && Number.isFinite(next[0])) {
    return internFlatSparkline(next[0]);
  }
  return next;
}

/** Normalize freshly parsed sparkline arrays (flat interning). */
export function normalizeSparklineArray(values: number[] | undefined): number[] | undefined {
  if (!values) return undefined;
  if (values.length === 2 && values[0] === values[1] && Number.isFinite(values[0])) {
    return internFlatSparkline(values[0]);
  }
  return values;
}
