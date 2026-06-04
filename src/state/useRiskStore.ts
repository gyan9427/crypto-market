import { create } from 'zustand';
import type { RiskCoinDto, RiskMeta } from '../types/risk';
import type { RiskSnapshotData } from '../services/riskApi';

type RiskState = {
  meta: RiskMeta;
  snapshot: RiskSnapshotData | null;
  crsBySymbol: Map<string, RiskCoinDto>;
  previousCrsBySymbol: Map<string, number>;
  crsDeltaBySymbol: Map<string, number>;
  setSnapshot: (meta: RiskMeta, snapshot: RiskSnapshotData | null) => void;
  getCrs: (symbol: string) => RiskCoinDto | undefined;
  getCrsDelta: (symbol: string) => number;
};

const EMPTY_META: RiskMeta = {
  revision: 0,
  buildId: '',
  buildFingerprint: '',
  computedAt: null,
  stale: true,
  partial: false,
};

function buildCrsMaps(coins: RiskCoinDto[]): {
  crsBySymbol: Map<string, RiskCoinDto>;
  crsValues: Map<string, number>;
} {
  const crsBySymbol = new Map<string, RiskCoinDto>();
  const crsValues = new Map<string, number>();
  for (const c of coins) {
    const sym = c.symbol.toUpperCase();
    crsBySymbol.set(sym, c);
    crsValues.set(sym, c.crs);
  }
  return { crsBySymbol, crsValues };
}

function computeDelta(
  previous: Map<string, number>,
  current: Map<string, number>
): Map<string, number> {
  const delta = new Map<string, number>();
  for (const [sym, crs] of current) {
    const prev = previous.get(sym);
    if (prev !== undefined) {
      delta.set(sym, crs - prev);
    }
  }
  return delta;
}

export const useRiskStore = create<RiskState>((set, get) => ({
  meta: EMPTY_META,
  snapshot: null,
  crsBySymbol: new Map(),
  previousCrsBySymbol: new Map(),
  crsDeltaBySymbol: new Map(),

  setSnapshot: (meta, snapshot) => {
    const state = get();
    let previousCrsBySymbol = state.previousCrsBySymbol;
    let crsDeltaBySymbol = state.crsDeltaBySymbol;
    let crsBySymbol = state.crsBySymbol;

    if (snapshot && meta.revision >= state.meta.revision) {
      const { crsBySymbol: nextCrs, crsValues } = buildCrsMaps(snapshot.coins);
      crsBySymbol = nextCrs;

      if (meta.revision > state.meta.revision && state.previousCrsBySymbol.size > 0) {
        crsDeltaBySymbol = computeDelta(state.previousCrsBySymbol, crsValues);
      } else if (meta.revision > state.meta.revision) {
        crsDeltaBySymbol = new Map();
      }

      previousCrsBySymbol = crsValues;
    } else if (!snapshot) {
      crsBySymbol = new Map();
    }

    set({ meta, snapshot, crsBySymbol, previousCrsBySymbol, crsDeltaBySymbol });
  },

  getCrs: (symbol) => get().crsBySymbol.get(symbol.toUpperCase()),

  getCrsDelta: (symbol) => get().crsDeltaBySymbol.get(symbol.toUpperCase()) ?? 0,
}));
