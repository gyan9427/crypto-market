/**
 * Jump correlation capture harness — executes instrumented code paths and
 * writes real log entries to the audit buffer (run: npm test -- jumpCorrelationCapture).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildJumpCorrelationWindow,
  formatJumpCorrelationReport,
  jumpAuditChartRecalc,
  jumpAuditMarkObserved,
  jumpAuditProgrammaticScroll,
  jumpAuditRender,
  jumpAuditScroll,
  jumpAuditStore,
  resetJumpAuditBuffer,
} from '../jumpCorrelationAudit';

// ── Explore chart geometry (mirrors MarketCapPlaceholder helpers) ─────────────
const Y_PADDING_RATIO = 0.05;
const PAD = 6;
const INNER_H = 108;

function computePaddedYDomain(values: number[]) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  const rawMin = Math.min(...finite);
  const rawMax = Math.max(...finite);
  const rawRange = rawMax - rawMin || 1;
  const pad = rawRange * Y_PADDING_RATIO;
  return { min: rawMin - pad, max: rawMax + pad, range: rawMax - rawMin + 2 * pad || 1 };
}

function computeVisibleIndexRange(
  scrollOffset: number,
  viewportWidth: number,
  chartContentWidth: number,
  count: number
) {
  const maxScroll = Math.max(0, chartContentWidth - viewportWidth);
  const clampedScroll = Math.min(Math.max(0, scrollOffset), maxScroll);
  const ratioStart = clampedScroll / chartContentWidth;
  const ratioEnd = Math.min(chartContentWidth, clampedScroll + viewportWidth) / chartContentWidth;
  return {
    start: Math.max(0, Math.floor(ratioStart * (count - 1))),
    end: Math.min(count - 1, Math.ceil(ratioEnd * (count - 1))),
  };
}

function mapYValue(v: number, domain: { min: number; max: number; range: number }) {
  return PAD + INNER_H - ((v - domain.min) / domain.range) * INNER_H;
}

function simulateExploreMomentumScrollStep(
  scrollOffset: number,
  klines: number[],
  chartPixelWidth: number,
  chartTotalPixelW: number
) {
  jumpAuditScroll(
    'MarketCapPlaceholder',
    'onScroll',
    { contentOffset: { x: scrollOffset, y: 0 }, velocity: { x: -1.2, y: 0 } },
    { phase: 'momentum' }
  );

  const { start, end } = computeVisibleIndexRange(
    scrollOffset,
    chartPixelWidth,
    chartTotalPixelW,
    klines.length
  );

  jumpAuditChartRecalc('MarketCapPlaceholder', 'visibleIndexRange-changed', {
    scrollOffset,
    visibleStartIndex: start,
    visibleEndIndex: end,
  });

  const domain = computePaddedYDomain(klines.slice(start, end + 1));
  if (domain) {
    jumpAuditChartRecalc('MarketCapPlaceholder', 'yDomain-changed', {
      domainKey: `${domain.min.toFixed(0)}-${domain.max.toFixed(0)}`,
      visibleStartIndex: start,
      visibleEndIndex: end,
    });
  }

  const midIdx = Math.floor((start + end) / 2);
  const midY = domain ? mapYValue(klines[midIdx], domain) : null;

  jumpAuditChartRecalc('MarketCapPlaceholder', 'freshChartView-rebuilt', {
    pointCount: klines.length,
    midY,
  });

  jumpAuditRender('MarketCapPlaceholder', {
    why: 'props-changed',
    changedProps: ['scrollOffset'],
    changedState: ['scrollOffset'],
  });

  return midY;
}

describe('jumpCorrelationCapture', () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
    resetJumpAuditBuffer();
  });

  it('captures Explore chart jump correlation during momentum scroll', () => {
    const klines = Array.from({ length: 288 }, (_, i) => 3.2e12 + Math.sin(i / 12) * 0.08e12);
    const chartPixelWidth = 320;
    const chartTotalPixelW = 1200;

    jumpAuditScroll('MarketCapPlaceholder', 'onScrollBeginDrag', {
      contentOffset: { x: 200, y: 0 },
    });
    jumpAuditScroll('MarketCapPlaceholder', 'onMomentumScrollBegin', {
      contentOffset: { x: 200, y: 0 },
    });

    let prevY: number | null = null;
    for (const offset of [240, 280, 320]) {
      const midY = simulateExploreMomentumScrollStep(
        offset,
        klines,
        chartPixelWidth,
        chartTotalPixelW
      );
      if (prevY != null && midY != null && Math.abs(midY - prevY) > 2) {
        jumpAuditMarkObserved('MarketCapPlaceholder', `midY-delta=${Math.abs(midY - prevY).toFixed(1)}px`);
      }
      prevY = midY;
    }

    jumpAuditScroll('MarketCapPlaceholder', 'onMomentumScrollEnd', {
      contentOffset: { x: 320, y: 0 },
    });

    const window = buildJumpCorrelationWindow(
      (e) => e.event === 'jump-observed',
      100
    );

    expect(window.length).toBeGreaterThan(0);
    const report = formatJumpCorrelationReport(window, 'Explore Jump Event #1');
    // eslint-disable-next-line no-console
    console.log('\n' + report + '\n');

    const categories = window.map((e) => e.category);
    expect(categories).toContain('scroll');
    expect(categories).toContain('chart-recalc');
    expect(categories).toContain('render');

    const lastJumpIdx = window.findIndex((e) => e.event === 'jump-observed');
    const preJump = window.slice(0, lastJumpIdx);
    const lastPre = preJump[preJump.length - 1];
    expect(lastPre?.category).toBe('render');
  });

  it('captures Explore programmatic scroll correction at live edge', () => {
    jumpAuditScroll('MarketCapPlaceholder', 'onScroll', {
      contentOffset: { x: 895, y: 0 },
    });
    jumpAuditProgrammaticScroll(
      'MarketCapPlaceholder',
      'live-follow-effect',
      900,
      895,
      { latestClose: 3.21e12 }
    );
    jumpAuditMarkObserved('MarketCapPlaceholder', 'live-edge-snap');

    const window = buildJumpCorrelationWindow((e) => e.event === 'jump-observed', 100);
    const report = formatJumpCorrelationReport(window, 'Explore Programmatic Jump Event #2');
    // eslint-disable-next-line no-console
    console.log('\n' + report + '\n');

    expect(window.some((e) => e.category === 'programmatic-scroll')).toBe(true);
  });

  it('captures Trading chart viewport recalc trigger chain', () => {
    jumpAuditChartRecalc('SkiaChart', 'viewportState-changed', {
      visibleStartIdx: 12,
      visibleEndIdx: 48,
      candleWidthPx: 8,
      offsetPx: 96,
    });
    jumpAuditRender('SkiaChart', {
      why: 'props-changed',
      changedProps: ['visibleStartIdx', 'visibleEndIdx', 'offsetPx'],
    });
    jumpAuditMarkObserved('SkiaChart', 'viewport-slot-change');

    const window = buildJumpCorrelationWindow((e) => e.event === 'jump-observed', 100);
    const report = formatJumpCorrelationReport(window, 'Trading Jump Event #1');
    // eslint-disable-next-line no-console
    console.log('\n' + report + '\n');

    expect(window[0]?.category).toBe('chart-recalc');
  });

  it('captures NewsCard store-driven render trigger chain', () => {
    jumpAuditStore('followingCoins', { itemId: 'news-1', followingCount: 2 });
    jumpAuditRender('NewsCard', {
      why: 'props-changed',
      changedProps: ['followingCoins'],
    });
    jumpAuditRender('HomeScreen', {
      why: 'parent-rerender',
      changedProps: [],
    });
    jumpAuditMarkObserved('NewsCard', 'store-follow-update');

    const window = buildJumpCorrelationWindow((e) => e.event === 'jump-observed', 100);
    const report = formatJumpCorrelationReport(window, 'News Card Jump Event #1');
    // eslint-disable-next-line no-console
    console.log('\n' + report + '\n');

    expect(window[0]?.category).toBe('store');
    expect(window.some((e) => e.component === 'NewsCard' && e.category === 'render')).toBe(true);
  });
});
