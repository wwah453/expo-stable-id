import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import {
  StableIdProvider,
  useStableId,
} from '@nauverse/expo-stable-id';

function StableIdDemo() {
  const [id, { identify, generateNewId }] = useStableId();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expo-stable-id</Text>

      <Text style={styles.label}>Current Stable ID:</Text>
      <Text style={styles.value}>{id ?? 'Loading...'}</Text>

      <View style={styles.buttons}>
        <Button
          title="Generate New ID"
          onPress={() => {
            generateNewId();
          }}
        />
        <Button
          title="Set Custom ID"
          onPress={() => {
            identify('custom-user-123');
          }}
        />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <StableIdProvider>
      <StableIdDemo />
    </StableIdProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
  },
  value: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginTop: 4,
    marginBottom: 10,
  },
  buttons: {
    gap: 10,
    marginTop: 10,
  },
});
