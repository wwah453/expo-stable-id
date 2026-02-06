# @nauverse/expo-stable-id

[![npm version](https://img.shields.io/npm/v/@nauverse/expo-stable-id.svg)](https://www.npmjs.com/package/@nauverse/expo-stable-id)
[![CI](https://github.com/TheNaubit/expo-stable-id/actions/workflows/ci.yml/badge.svg)](https://github.com/TheNaubit/expo-stable-id/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Persistent, cross-device user identifier for React Native/Expo. Port of [StableID](https://github.com/codykerns/StableID) (Swift) to the Expo ecosystem, big thanks to him for that awesome lib!

## How it works

`expo-stable-id` provides a persistent user identifier using **dual storage**:

- **Cloud**: [`@nauverse/expo-cloud-settings`](https://github.com/TheNaubit/expo-cloud-settings) (iCloud KVS on iOS, future Android support) - syncs across devices
- **Local**: [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/) (Keychain on iOS, Android Keystore) - persists across app reinstalls

The ID is generated once and persisted to both storages. On subsequent launches, the stored ID is read back. When iCloud syncs a new ID from another device, the local copy is updated.

## Installation

```bash
npx expo install @nauverse/expo-stable-id @nauverse/expo-cloud-settings expo-secure-store
```

### Config Plugin

Add to your `app.config.ts` / `app.json`:

```ts
export default {
  plugins: ['@nauverse/expo-stable-id'],
};
```

This adds the iCloud KVS entitlement required for cloud sync. Optionally pass a custom container:

```ts
export default {
  plugins: [
    ['@nauverse/expo-stable-id', { containerIdentifier: 'com.example.shared' }],
  ],
};
```

## Usage

### React Hooks (Recommended)

```tsx
import { StableIdProvider, useStableId, useAppTransactionId } from '@nauverse/expo-stable-id';

function App() {
  return (
    <StableIdProvider>
      <MyComponent />
    </StableIdProvider>
  );
}

function MyComponent() {
  const [id, { identify, generateNewId }] = useStableId();

  return (
    <View>
      <Text>Stable ID: {id ?? 'Loading...'}</Text>
      <Button title="New ID" onPress={() => generateNewId()} />
      <Button title="Set Custom" onPress={() => identify('user-123')} />
    </View>
  );
}
```

#### Provider Config

```tsx
import { StandardGenerator, ShortIDGenerator } from '@nauverse/expo-stable-id';

// Use short 8-char IDs instead of UUIDs
<StableIdProvider config={{ generator: new ShortIDGenerator() }}>

// Provide a known ID, force it even if one exists
<StableIdProvider config={{ id: 'known-user-id', policy: 'forceUpdate' }}>

// Provide a fallback ID, prefer any stored value
<StableIdProvider config={{ id: 'fallback-id', policy: 'preferStored' }}>
```

#### AppTransaction Hook

```tsx
function TransactionInfo() {
  const { id, loading, error, refetch } = useAppTransactionId();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return <Text>App Transaction: {id ?? 'N/A'}</Text>;
}
```

### Functional API

```ts
import {
  configure,
  getId,
  identify,
  generateNewId,
  fetchAppTransactionId,
  isConfigured,
  hasStoredId,
  addChangeListener,
  setWillChangeHandler,
} from '@nauverse/expo-stable-id';

// Initialize (call once at app startup)
const id = await configure();

// Or with options
const id = await configure({
  id: 'fallback-id',
  policy: 'preferStored',
  generator: new ShortIDGenerator(),
});

// Read current ID (sync, from cache)
const currentId = getId();

// Change ID
identify('new-user-id');

// Generate a new random ID
const newId = generateNewId();

// Check state
isConfigured(); // boolean
await hasStoredId(); // boolean

// StoreKit App Transaction (iOS 16+ only)
const txnId = await fetchAppTransactionId(); // null on Android

// Listen for changes
const subscription = addChangeListener((event) => {
  console.log(`ID changed: ${event.previousId} -> ${event.newId} (${event.source})`);
});
subscription.remove();

// Intercept changes before they apply (identify, generateNewId, cloud sync)
setWillChangeHandler((currentId, candidateId) => {
  // Return modified ID, or null to accept candidate as-is
  return candidateId;
});
```

## ID Generators

| Generator | Output | Example |
|-----------|--------|---------|
| `StandardGenerator` (default) | UUID v4 | `a1b2c3d4-e5f6-4789-abcd-ef0123456789` |
| `ShortIDGenerator` | 8-char alphanumeric | `xK9mP2nQ` |

Custom generators implement the `IDGenerator` interface:

```ts
import type { IDGenerator } from '@nauverse/expo-stable-id';

const myGenerator: IDGenerator = {
  generate: () => `prefix-${Date.now()}`,
};
```

## Policies

| Policy | Behavior |
|--------|----------|
| `'forceUpdate'` (default) | Always use the provided `id` (if given) |
| `'preferStored'` | Use stored ID if available, fall back to provided `id` |

## Platform Support

| Feature | iOS | Android |
|---------|-----|---------|
| Local storage (Keychain/Keystore) | Yes | Yes |
| Cloud sync (iCloud KVS) | Yes | Coming soon |
| App Transaction ID (StoreKit) | iOS 16+ | Returns `null` |
| ID generation | Yes | Yes |

## API Reference

### Functional API

| Function | Returns | Description |
|----------|---------|-------------|
| `configure(config?)` | `Promise<string>` | Initialize and get/create stable ID |
| `getId()` | `string \| null` | Current cached ID (sync) |
| `identify(id)` | `void` | Set a specific ID |
| `generateNewId()` | `string` | Generate and persist a new ID |
| `fetchAppTransactionId()` | `Promise<string \| null>` | StoreKit App Transaction (iOS 16+, null on Android) |
| `isConfigured()` | `boolean` | Whether `configure()` has been called |
| `hasStoredId()` | `Promise<boolean>` | Whether an ID exists in storage |
| `addChangeListener(cb)` | `{ remove: () => void }` | Subscribe to ID changes |
| `setWillChangeHandler(fn)` | `void` | Intercept all ID changes before they apply |

### React API

| Export | Description |
|--------|-------------|
| `StableIdProvider` | Context provider, call `configure()` internally |
| `useStableId()` | `[id, { identify, generateNewId }]` |
| `useAppTransactionId()` | `{ id, loading, error, refetch }` |

### Types

```ts
type IDPolicy = 'preferStored' | 'forceUpdate';
type ChangeSource = 'cloud' | 'manual';

interface IDGenerator {
  generate(): string;
}

interface StableIdConfig {
  readonly id?: string;
  readonly generator?: IDGenerator;
  readonly policy?: IDPolicy;
}

interface StableIdChangeEvent {
  readonly previousId: string | null;
  readonly newId: string;
  readonly source: ChangeSource;
}
```

## Feature Mapping from StableID (Swift)

| StableID (Swift) | expo-stable-id | Notes |
|------------------|----------------|-------|
| `StableID.configure(id?, generator, policy)` | `configure(config?)` | Same semantics |
| `StableID.id` | `getId()` / `useStableId()[0]` | Sync cached read |
| `StableID.identify(id:)` | `identify(id)` | Writes both storages |
| `StableID.generateNewID()` | `generateNewId()` | Uses configured generator |
| `StableID.isConfigured` | `isConfigured()` | Static check |
| `StableID.hasStoredID` | `hasStoredId()` | Checks both storages |
| `StableID.fetchAppTransactionID()` | `fetchAppTransactionId()` | StoreKit (iOS 16+) |
| `StableID.set(delegate:)` | `addChangeListener()` + `setWillChangeHandler()` | JS-idiomatic |
| `StandardGenerator` | `StandardGenerator` | UUID v4 |
| `ShortIDGenerator` | `ShortIDGenerator` | 8-char alphanumeric |

## License

MIT
