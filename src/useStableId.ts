import { useCallback, useEffect, useMemo, useState } from 'react';

import ExpoStableIdModule from './ExpoStableIdModule';
import { useStableIdSnapshot, useStableIdStore } from './StableIdProvider';

export interface StableIdActions {
  readonly identify: (id: string) => void;
  readonly generateNewId: () => string;
}

export function useStableId(): readonly [string | null, StableIdActions] {
  const store = useStableIdStore();
  const id = useStableIdSnapshot();

  const actions: StableIdActions = useMemo(
    () => ({
      identify: (newId: string) => store.identify(newId),
      generateNewId: () => store.generateNewId(),
    }),
    [store]
  );

  return [id, actions] as const;
}

export interface AppTransactionIdResult {
  readonly id: string | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
}

export function useAppTransactionId(): AppTransactionIdResult {
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    ExpoStableIdModule.fetchAppTransactionId()
      .then((result) => {
        if (active) {
          setId(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [fetchCount]);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  return { id, loading, error, refetch };
}
