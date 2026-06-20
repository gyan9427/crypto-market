import type { TFunction } from 'i18next';
import type { ExchangeConnection, HoldingPosition, Holdings, WalletAddress } from '../types';
import { isExchangeHolding } from './portfolioSource';

export type PortfolioAccountSelection =
  | { kind: 'entire_portfolio' }
  | { kind: 'all_wallets' }
  | { kind: 'wallet'; id: string; address: string; label?: string }
  | { kind: 'all_exchanges' }
  | { kind: 'exchange'; id: string; label?: string; provider: string };

export const DEFAULT_PORTFOLIO_ACCOUNT_SELECTION: PortfolioAccountSelection = {
  kind: 'entire_portfolio',
};

export type FilteredHoldingsView = {
  positions: HoldingPosition[];
  displayTotal: number;
  showCombined24h: boolean;
  relativeChange24h: number;
  emptyFiltered: boolean;
};

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function mergeBySymbolChain(positions: HoldingPosition[]): HoldingPosition[] {
  const byKey = new Map<string, HoldingPosition>();
  for (const p of positions) {
    const key = `${p.symbol}:${p.chain}`.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += p.quantity;
      existing.value += p.value;
    } else {
      byKey.set(key, { ...p });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => b.value - a.value);
}

export function isSameAccountSelection(
  a: PortfolioAccountSelection,
  b: PortfolioAccountSelection
): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'wallet' && b.kind === 'wallet') return a.id === b.id;
  if (a.kind === 'exchange' && b.kind === 'exchange') return a.id === b.id;
  return true;
}

export function reconcileAccountSelection(
  selection: PortfolioAccountSelection,
  wallets: WalletAddress[],
  exchanges: ExchangeConnection[]
): PortfolioAccountSelection {
  if (selection.kind === 'wallet' && !wallets.some((w) => w.id === selection.id)) {
    return DEFAULT_PORTFOLIO_ACCOUNT_SELECTION;
  }
  if (selection.kind === 'exchange' && !exchanges.some((e) => e.id === selection.id)) {
    return DEFAULT_PORTFOLIO_ACCOUNT_SELECTION;
  }
  if (selection.kind === 'all_wallets' && wallets.length === 0) {
    return DEFAULT_PORTFOLIO_ACCOUNT_SELECTION;
  }
  if (selection.kind === 'all_exchanges' && exchanges.length === 0) {
    return DEFAULT_PORTFOLIO_ACCOUNT_SELECTION;
  }
  return selection;
}

export function getAccountSelectionLabel(
  selection: PortfolioAccountSelection,
  t: TFunction,
  wallets: WalletAddress[],
  exchanges: ExchangeConnection[]
): string {
  switch (selection.kind) {
    case 'entire_portfolio':
      return t('portfolio.entirePortfolio');
    case 'all_wallets':
      return t('portfolio.allWallets');
    case 'all_exchanges':
      return t('portfolio.allExchanges');
    case 'wallet': {
      const w = wallets.find((x) => x.id === selection.id);
      return w?.label?.trim() || truncateAddress(selection.address);
    }
    case 'exchange': {
      const ex = exchanges.find((x) => x.id === selection.id);
      if (ex?.label?.trim()) return ex.label.trim();
      if (ex?.provider === 'coindcx') return t('monitorExchange.providerCoinDcx');
      return ex?.provider ?? t('portfolio.sectionExchange');
    }
    default:
      return t('portfolio.entirePortfolio');
  }
}

export function isEntirePortfolioScope(selection: PortfolioAccountSelection): boolean {
  return selection.kind === 'entire_portfolio';
}

export function filterHoldingsByAccount(
  holdings: Holdings,
  selection: PortfolioAccountSelection
): FilteredHoldingsView {
  const positions = holdings.positions ?? [];

  if (selection.kind === 'entire_portfolio') {
    const merged = mergeBySymbolChain(positions);
    return {
      positions: merged,
      displayTotal: holdings.totalValue,
      showCombined24h: true,
      relativeChange24h: holdings.relativeChange24h,
      emptyFiltered: false,
    };
  }

  if (selection.kind === 'all_wallets') {
    const walletPositions = positions.filter((p) => !isExchangeHolding(p));
    const merged = mergeBySymbolChain(walletPositions);
    const displayTotal = merged.reduce((sum, p) => sum + (p.value ?? 0), 0);
    return {
      positions: merged,
      displayTotal,
      showCombined24h: false,
      relativeChange24h: 0,
      emptyFiltered: merged.length === 0 && walletPositions.length > 0,
    };
  }

  if (selection.kind === 'wallet') {
    const filtered = positions.filter(
      (p) => !isExchangeHolding(p) && p.sourceConnectionId === selection.id
    );
    const displayTotal = filtered.reduce((sum, p) => sum + (p.value ?? 0), 0);
    return {
      positions: filtered,
      displayTotal,
      showCombined24h: false,
      relativeChange24h: 0,
      emptyFiltered:
        filtered.length === 0 &&
        positions.some((p) => !isExchangeHolding(p)),
    };
  }

  if (selection.kind === 'all_exchanges') {
    const exchangePositions = positions.filter((p) => isExchangeHolding(p));
    const merged = mergeBySymbolChain(exchangePositions);
    const displayTotal = merged.reduce((sum, p) => sum + (p.value ?? 0), 0);
    return {
      positions: merged,
      displayTotal,
      showCombined24h: false,
      relativeChange24h: 0,
      emptyFiltered: merged.length === 0 && exchangePositions.length > 0,
    };
  }

  // single exchange
  const filtered = positions.filter(
    (p) => isExchangeHolding(p) && p.sourceConnectionId === selection.id
  );
  const displayTotal = filtered.reduce((sum, p) => sum + (p.value ?? 0), 0);
  return {
    positions: filtered,
    displayTotal,
    showCombined24h: false,
    relativeChange24h: 0,
    emptyFiltered:
      filtered.length === 0 && positions.some((p) => isExchangeHolding(p)),
  };
}
