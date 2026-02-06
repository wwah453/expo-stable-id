import type { EventSubscription } from 'expo-modules-core';

import {
  getString as cloudGetString,
  setString as cloudSetString,
  addChangeListener as cloudAddChangeListener,
} from '@nauverse/expo-cloud-settings';
import {
  getItemAsync as secureGetItem,
  setItemAsync as secureSetItem,
} from 'expo-secure-store';

import type {
  IDGenerator,
  IDPolicy,
  StableIdChangeEvent,
  StableIdConfig,
  ChangeSource,
  WillChangeHandler,
} from './StableId.types';
import { StandardGenerator } from './generators/IDGenerator';

type Listener = () => void;
type ChangeCallback = (event: StableIdChangeEvent) => void;

const STORAGE_KEY = '_StableID_Identifier';

export class StableIdStore {
  private id: string | null = null;
  private generator: IDGenerator = new StandardGenerator();
  private policy: IDPolicy = 'forceUpdate';
  private configured = false;
  private willChangeHandler: WillChangeHandler | null = null;
  private changeListeners = new Set<ChangeCallback>();
  private storeListeners = new Set<Listener>();
  private cloudSubscription: EventSubscription | null = null;

  private async readStored(): Promise<string | null> {
    try {
      const cloudValue = cloudGetString(STORAGE_KEY);
      if (cloudValue !== null) {
        return cloudValue;
      }
    } catch {
      // Cloud not available (e.g., Android)
    }

    try {
      const localValue = await secureGetItem(STORAGE_KEY);
      if (localValue !== null) {
        return localValue;
      }
    } catch {
      // Secure store not available
    }

    return null;
  }

  private persist(id: string): void {
    try {
      cloudSetString(STORAGE_KEY, id);
    } catch {
      // Cloud not available
    }

    secureSetItem(STORAGE_KEY, id).catch(() => {
      // Secure store write failed
    });
  }

  private notifyChange(previousId: string | null, newId: string, source: ChangeSource): void {
    const event: StableIdChangeEvent = { previousId, newId, source };
    for (const listener of this.changeListeners) {
      listener(event);
    }
  }

  private notifyStore(): void {
    for (const listener of this.storeListeners) {
      listener();
    }
  }

  private applyWillChange(candidateId: string): string {
    if (this.willChangeHandler === null || this.id === null) {
      return candidateId;
    }
    const result = this.willChangeHandler(this.id, candidateId);
    return result ?? candidateId;
  }

  async configure(config?: StableIdConfig): Promise<string> {
    if (this.configured) {
      return this.id!;
    }

    if (config?.generator) {
      this.generator = config.generator;
    }
    if (config?.policy) {
      this.policy = config.policy;
    }

    const stored = await this.readStored();
    let resolvedId: string;

    if (config?.id) {
      if (this.policy === 'preferStored' && stored !== null) {
        resolvedId = stored;
      } else {
        resolvedId = config.id;
      }
    } else {
      resolvedId = stored ?? this.generator.generate();
    }

    this.id = resolvedId;
    this.configured = true;
    this.persist(resolvedId);
    this.notifyStore();

    this.cloudSubscription = cloudAddChangeListener((event) => {
      this.onCloudChange(event.changedKeys);
    });

    return resolvedId;
  }

  private onCloudChange(changedKeys: readonly string[]): void {
    if (!changedKeys.includes(STORAGE_KEY)) {
      return;
    }

    let cloudValue: string | null = null;
    try {
      cloudValue = cloudGetString(STORAGE_KEY);
    } catch {
      return;
    }

    if (cloudValue === null || cloudValue === this.id) {
      return;
    }

    this.setIdentity(cloudValue, 'cloud');
  }

  getId(): string | null {
    return this.id;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private setIdentity(candidateId: string, source: ChangeSource): string {
    if (candidateId === this.id) {
      return candidateId;
    }
    const previousId = this.id;
    const finalId = this.applyWillChange(candidateId);
    if (finalId === previousId) {
      return finalId;
    }
    this.id = finalId;
    this.persist(finalId);
    this.notifyStore();
    this.notifyChange(previousId, finalId, source);
    return finalId;
  }

  identify(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('StableId: id must be a non-empty string');
    }
    this.setIdentity(id, 'manual');
  }

  generateNewId(): string {
    const newId = this.generator.generate();
    return this.setIdentity(newId, 'manual');
  }

  async hasStoredId(): Promise<boolean> {
    const stored = await this.readStored();
    return stored !== null;
  }

  subscribe(listener: Listener): () => void {
    this.storeListeners.add(listener);
    return () => {
      this.storeListeners.delete(listener);
    };
  }

  addChangeListener(callback: ChangeCallback): () => void {
    this.changeListeners.add(callback);
    return () => {
      this.changeListeners.delete(callback);
    };
  }

  setWillChangeHandler(handler: WillChangeHandler | null): void {
    this.willChangeHandler = handler;
  }

  dispose(): void {
    if (this.cloudSubscription) {
      this.cloudSubscription.remove();
      this.cloudSubscription = null;
    }
    this.changeListeners.clear();
    this.storeListeners.clear();
  }
}
