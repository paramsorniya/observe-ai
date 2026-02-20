import { describe, it, expect } from 'vitest';
import { generateApiKey } from '../../../utils/apiKey.js';

describe('generateApiKey', () => {
  it('returns a string starting with obs_', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^obs_/);
  });

  it('returns unique keys on each call', () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateApiKey()));
    expect(keys.size).toBe(20);
  });

  it('has the expected length (obs_ + 32 base64url chars from 24 bytes)', () => {
    const key = generateApiKey();
    // 24 random bytes in base64url = 32 chars, prefix = "obs_" (4 chars) = 36 total
    expect(key.length).toBe(36);
  });

  it('only contains valid base64url characters after the prefix', () => {
    const key = generateApiKey();
    const suffix = key.slice(4); // Remove "obs_"
    expect(suffix).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('never contains padding characters', () => {
    for (let i = 0; i < 10; i++) {
      expect(generateApiKey()).not.toContain('=');
    }
  });
});
