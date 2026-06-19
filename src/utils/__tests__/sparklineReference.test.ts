import { describe, expect, it } from 'vitest';
import {
  internFlatSparkline,
  normalizeSparklineArray,
  preserveSparklineReference,
  sparklineValuesEqual,
} from '../sparklineReference';

describe('sparklineValuesEqual', () => {
  it('returns true for same reference', () => {
    const arr = [1, 2, 3];
    expect(sparklineValuesEqual(arr, arr)).toBe(true);
  });

  it('returns true for equal values different refs', () => {
    expect(sparklineValuesEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false when length differs', () => {
    expect(sparklineValuesEqual([1, 2], [1, 2, 3])).toBe(false);
  });
});

describe('preserveSparklineReference', () => {
  it('reuses prev when values match', () => {
    const prev = [100, 101, 102];
    const next = [100, 101, 102];
    expect(preserveSparklineReference(prev, next)).toBe(prev);
  });

  it('returns next when values differ', () => {
    const prev = [100, 101];
    const next = [100, 105];
    expect(preserveSparklineReference(prev, next)).toBe(next);
  });

  it('interns flat pairs', () => {
    const a = preserveSparklineReference(undefined, [42, 42]);
    const b = preserveSparklineReference(undefined, [42, 42]);
    expect(a).toBe(b);
    expect(a).toBe(internFlatSparkline(42));
  });
});

describe('normalizeSparklineArray', () => {
  it('interns flat arrays', () => {
    const a = normalizeSparklineArray([7, 7]);
    const b = normalizeSparklineArray([7, 7]);
    expect(a).toBe(b);
  });
});
