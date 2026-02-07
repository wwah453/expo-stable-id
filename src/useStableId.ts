import { useMemo } from 'react';

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
