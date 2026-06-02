import { useCallback, useEffect, useRef, useState } from 'react';
import type { RiskMeta } from '../types/risk';

/**
 * Tracks monotonic RRS snapshot revision — ignores out-of-order or partial payloads.
 */
export function useRiskRevision(initialRevision = 0) {
  const [revision, setRevision] = useState(initialRevision);
  const [meta, setMeta] = useState<RiskMeta | null>(null);
  const revisionRef = useRef(initialRevision);

  const applyMeta = useCallback((incoming: RiskMeta | null | undefined) => {
    if (!incoming) return false;
    if (incoming.partial) return false;
    if (incoming.revision < revisionRef.current) return false;
    revisionRef.current = incoming.revision;
    setRevision(incoming.revision);
    setMeta(incoming);
    return true;
  }, []);

  const applyWsRevision = useCallback((incomingRevision: number) => {
    if (!Number.isFinite(incomingRevision) || incomingRevision < revisionRef.current) {
      return false;
    }
    revisionRef.current = incomingRevision;
    setRevision(incomingRevision);
    return true;
  }, []);

  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  return { revision, meta, applyMeta, applyWsRevision };
}
