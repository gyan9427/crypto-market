import { describe, expect, it } from 'vitest';
import type { Holdings } from '@/src/types';
import {
  filterHoldingsByAccount,
  isSameAccountSelection,
  reconcileAccountSelection,
} from '../portfolioAccountFilter';

const sampleHoldings: Holdings = {
  totalValue: 100,
  absoluteChange24h: 5,
  relativeChange24h: 5,
  positions: [
    {
      name: 'Polygon',
      symbol: 'POL',
      quantity: 100,
      value: 60,
      chain: 'polygon',
      source: 'wallet',
      sourceConnectionId: 'wallet-a',
    },
    {
      name: 'Polygon',
      symbol: 'POL',
      quantity: 50,
      value: 30,
      chain: 'polygon',
      source: 'wallet',
      sourceConnectionId: 'wallet-b',
    },
    {
      name: 'BTC',
      symbol: 'BTC',
      quantity: 0.01,
      value: 10,
      chain: 'coindcx',
      source: 'exchange',
      venue: 'coindcx',
      sourceConnectionId: 'ex-1',
    },
  ],
};

describe('portfolioAccountFilter', () => {
  it('merges entire portfolio by symbol', () => {
    const view = filterHoldingsByAccount(sampleHoldings, { kind: 'entire_portfolio' });
    expect(view.displayTotal).toBe(100);
    expect(view.showCombined24h).toBe(true);
    expect(view.positions).toHaveLength(2);
    expect(view.positions.find((p) => p.symbol === 'POL')?.value).toBe(90);
  });

  it('filters single wallet by sourceConnectionId', () => {
    const view = filterHoldingsByAccount(sampleHoldings, {
      kind: 'wallet',
      id: 'wallet-a',
      address: '0xaaa',
    });
    expect(view.displayTotal).toBe(60);
    expect(view.positions).toHaveLength(1);
    expect(view.positions[0].sourceConnectionId).toBe('wallet-a');
  });

  it('filters all wallets excluding exchange', () => {
    const view = filterHoldingsByAccount(sampleHoldings, { kind: 'all_wallets' });
    expect(view.displayTotal).toBe(90);
    expect(view.positions.every((p) => p.source !== 'exchange')).toBe(true);
  });

  it('filters all exchanges', () => {
    const view = filterHoldingsByAccount(sampleHoldings, { kind: 'all_exchanges' });
    expect(view.displayTotal).toBe(10);
    expect(view.positions).toHaveLength(1);
  });

  it('reconciles removed wallet selection', () => {
    const next = reconcileAccountSelection(
      { kind: 'wallet', id: 'gone', address: '0x1' },
      [{ id: 'w1', address: '0x2', chains: [], createdAt: '' }],
      []
    );
    expect(next.kind).toBe('entire_portfolio');
  });

  it('compares account selections', () => {
    expect(
      isSameAccountSelection({ kind: 'all_wallets' }, { kind: 'all_wallets' })
    ).toBe(true);
    expect(
      isSameAccountSelection(
        { kind: 'wallet', id: 'a', address: '0x' },
        { kind: 'wallet', id: 'b', address: '0x' }
      )
    ).toBe(false);
  });
});
