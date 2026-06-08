import { describe, expect, it } from 'vitest';
import { useFeedStore } from '@/src/state/useFeedStore';

describe('revision consistency', () => {
  it('rejects out-of-order activeRiskRevision updates', () => {
    useFeedStore.setState({ activeRiskRevision: 10 });

    const accepted = useFeedStore.getState().setActiveRiskRevision(12);
    const rejected = useFeedStore.getState().setActiveRiskRevision(8);

    expect(accepted).toBe(true);
    expect(rejected).toBe(false);
    expect(useFeedStore.getState().activeRiskRevision).toBe(12);
  });
});
