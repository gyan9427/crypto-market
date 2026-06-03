import { create } from 'zustand';
import type { RiskCoinDto, RiskMeta } from '../types/risk';
import type { RiskSnapshotData } from '../services/riskApi';

type RiskState = {
  meta: RiskMeta;
  snapshot: RiskSnapshotData | null;
  crsBySymbol: Map<string, RiskCoinDto>;
  setSnapshot: (meta: RiskMeta, snapshot: RiskSnapshotData | null) => void;
  getCrs: (symbol: string) => RiskCoinDto | undefined;
};

const EMPTY_META: RiskMeta = {
  revision: 0,
  buildId: '',
  buildFingerprint: '',
  computedAt: null,
  stale: true,
  partial: false,
};

export const useRiskStore = create<RiskState>((set, get) => ({
  meta: EMPTY_META,
  snapshot: null,
  crsBySymbol: new Map(),
  setSnapshot: (meta, snapshot) => {
    const crsBySymbol = snapshot
      ? new Map(snapshot.coins.map((c) => [c.symbol.toUpperCase(), c]))
      : new Map();
    set({ meta, snapshot, crsBySymbol });
  },
  getCrs: (symbol) => get().crsBySymbol.get(symbol.toUpperCase()),
}));
