import React, { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, useCallback } from 'react';

import type { StableIdConfig } from './StableId.types';
import { StableIdStore } from './StableIdStore';

const StableIdContext = createContext<StableIdStore | null>(null);

export interface StableIdProviderProps {
  readonly config?: StableIdConfig;
  readonly children: React.ReactNode;
}

export function StableIdProvider({ config, children }: StableIdProviderProps) {
  const storeRef = useRef<StableIdStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new StableIdStore();
  }
  const store = storeRef.current;

  const [, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    store.configure(config).then(() => {
      if (!disposed) {
        setReady(true);
      }
    }).catch(() => {
      // configure() failed - store remains unconfigured, getId() returns null
    });
    return () => {
      disposed = true;
      store.dispose();
    };
    // config is intentionally excluded: configure() is idempotent (only first call takes effect).
    // Including config would cause dispose/re-configure cycles on unstable object references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  return (
    <StableIdContext.Provider value={store}>
      {children}
    </StableIdContext.Provider>
  );
}

export function useStableIdStore(): StableIdStore {
  const store = useContext(StableIdContext);
  if (store === null) {
    throw new Error('useStableId requires <StableIdProvider> as an ancestor');
  }
  return store;
}

export function useStableIdSnapshot(): string | null {
  const store = useStableIdStore();

  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(listener),
    [store]
  );

  const getSnapshot = useCallback(() => store.getId(), [store]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
