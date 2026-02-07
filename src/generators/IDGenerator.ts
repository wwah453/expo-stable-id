import type { IDGenerator } from '../StableId.types';

export class StandardGenerator implements IDGenerator {
  generate(): string {
    // Manual UUID v4 using crypto.getRandomValues() for Hermes compatibility
    // (Hermes supports getRandomValues but not randomUUID)
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
