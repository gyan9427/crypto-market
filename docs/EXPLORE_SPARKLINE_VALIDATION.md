# Explore Sparkline Performance — Validation Checklist

Run in `__DEV__` with default feature flags (all enabled unless `EXPO_PUBLIC_EXPLORE_*=false`).

## Sparkline baseline architecture

- **5-hour historical baseline** loaded from `GET /charts/klines` (`1m` interval, 300 points) via `prefetchSparklineBaselines` **before** coin rows render.
- **Live updates** append in-place in `sparklineHistoryHub` when WebSocket prices arrive — no full array rebuild.
- **Polling** updates metadata only (rank, price, change, cap, volume) via `applyMetadataCoins`; existing sparkline history is never replaced when WS is healthy.
- **WS reconnect** keeps the existing curve and resumes appending.

## Instrumentation

- Console: `[explore-perf] poll updated=X skipped=Y sparklineReuse=Z sparklineNew=W`
- Console: `[explore-render] component=...` attribution lines
- Programmatic: `getExplorePerfSnapshot()` from `explorePerfMetrics.ts`

## Scenarios

| Scenario | Pass criteria |
|----------|---------------|
| Initial load | Skeleton only when list empty; no post-load sparkline reset |
| Category switch (Trending ↔ Top) | No skeleton flash; list stays mounted |
| 20s poll (quiet market) | `rowsSkipped ≥ 70%`; `sparklinesReused ≥ 70%`; ExploreCoinRow ≤ 3 renders/poll |
| WebSocket updates | Live price + sparkline tail still update (~10s throttle) |
| Pagination | Page 2 rows have sparklines immediately; no duplicate ids |

## Rollback

Set any of:

- `EXPO_PUBLIC_EXPLORE_STABLE_LOAD_LIFECYCLE=false`
- `EXPO_PUBLIC_EXPLORE_RECONCILE_ROWS=false`
- `EXPO_PUBLIC_EXPLORE_PRESERVE_SPARKLINES=false`
- `EXPO_PUBLIC_EXPLORE_MEMO_OPTIMIZATIONS=false`

## Go/no-go thresholds

- No visible sparkline reset on poll
- No skeleton flash on tab switch with populated list
- Poll skip rate ≥ 70% (5 min observation, quiet market)
- WS prices not frozen
