import type { HoldingPosition, WalletEvent } from '../types';

/**
 * Whether a holdings row is exchange-backed (CoinDCX today).
 * Prefer explicit `source`; fall back to chain/venue when `source` is absent (legacy payloads).
 */
export function isExchangeHolding(p: HoldingPosition): boolean {
  if (p.source === 'exchange') return true;
  if (p.source === 'wallet') return false;
  const chain = (p.chain ?? '').toLowerCase();
  const venue = (p.venue ?? '').toLowerCase();
  return chain === 'coindcx' || venue === 'coindcx';
}

/** Portfolio activity row from an exchange (CoinDCX trades, etc.). */
export function isExchangePortfolioEvent(e: WalletEvent): boolean {
  if (e.sourceType === 'exchange' || e.type === 'exchange_trade') return true;
  if (e.sourceType === 'wallet') return false;
  const chain = (e.chain ?? '').toLowerCase();
  const venue = (e.venue ?? '').toLowerCase();
  return chain === 'coindcx' || venue === 'coindcx';
}
