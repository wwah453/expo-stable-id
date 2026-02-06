import type { IDGenerator } from '../StableId.types';

export class StandardGenerator implements IDGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const REJECT_THRESHOLD = 256 - (256 % ALPHANUMERIC.length); // 248

export class ShortIDGenerator implements IDGenerator {
  generate(): string {
    let result = '';
    while (result.length < 8) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < bytes.length && result.length < 8; i++) {
        if (bytes[i] < REJECT_THRESHOLD) {
          result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
        }
      }
    }
    return result;
  }
}
