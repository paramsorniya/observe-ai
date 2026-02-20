import { describe, it, expect } from 'vitest';
import { calculateCost, MODEL_PRICING } from '../../../utils/pricing.js';

describe('calculateCost', () => {
  it('returns 0 for unknown model', () => {
    expect(calculateCost('unknown-model-xyz', 1000, 500)).toBe(0);
  });

  it('returns 0 for empty string model', () => {
    expect(calculateCost('', 1000, 500)).toBe(0);
  });

  it('calculates cost correctly for gpt-4o', () => {
    // gpt-4o: promptCost=0.005, completionCost=0.015 (per 1K tokens)
    const cost = calculateCost('gpt-4o', 1000, 1000);
    expect(cost).toBeCloseTo(0.005 + 0.015, 6);
  });

  it('calculates cost correctly for gpt-4', () => {
    // gpt-4: promptCost=0.03, completionCost=0.06 (per 1K tokens)
    const cost = calculateCost('gpt-4', 2000, 500);
    expect(cost).toBeCloseTo((2000 / 1000) * 0.03 + (500 / 1000) * 0.06, 6);
  });

  it('calculates cost correctly for claude-3-haiku', () => {
    const cost = calculateCost('claude-3-haiku', 5000, 2000);
    expect(cost).toBeCloseTo((5000 / 1000) * 0.00025 + (2000 / 1000) * 0.00125, 6);
  });

  it('returns 0 when both token counts are 0', () => {
    expect(calculateCost('gpt-4o', 0, 0)).toBe(0);
  });

  it('handles prompt tokens only', () => {
    const pricing = MODEL_PRICING['gpt-4o-mini'];
    const cost = calculateCost('gpt-4o-mini', 1000, 0);
    expect(cost).toBeCloseTo(pricing.promptCost, 6);
  });

  it('handles completion tokens only', () => {
    const pricing = MODEL_PRICING['gpt-3.5-turbo'];
    const cost = calculateCost('gpt-3.5-turbo', 0, 1000);
    expect(cost).toBeCloseTo(pricing.completionCost, 6);
  });

  it('calculates gemini-2.0-flash correctly', () => {
    const cost = calculateCost('gemini-2.0-flash', 10000, 5000);
    expect(cost).toBeCloseTo((10000 / 1000) * 0.0001 + (5000 / 1000) * 0.0004, 6);
  });
});

describe('MODEL_PRICING', () => {
  it('contains all expected OpenAI models', () => {
    expect(MODEL_PRICING).toHaveProperty('gpt-4');
    expect(MODEL_PRICING).toHaveProperty('gpt-4-turbo');
    expect(MODEL_PRICING).toHaveProperty('gpt-4o');
    expect(MODEL_PRICING).toHaveProperty('gpt-4o-mini');
    expect(MODEL_PRICING).toHaveProperty('gpt-3.5-turbo');
  });

  it('contains all expected Anthropic models', () => {
    expect(MODEL_PRICING).toHaveProperty('claude-3-opus');
    expect(MODEL_PRICING).toHaveProperty('claude-3-sonnet');
    expect(MODEL_PRICING).toHaveProperty('claude-3-haiku');
    expect(MODEL_PRICING).toHaveProperty('claude-3.5-sonnet');
  });

  it('contains all expected Gemini models', () => {
    expect(MODEL_PRICING).toHaveProperty('gemini-2.0-flash');
    expect(MODEL_PRICING).toHaveProperty('gemini-1.5-pro');
    expect(MODEL_PRICING).toHaveProperty('gemini-1.5-flash');
  });

  it('all entries have promptCost and completionCost as positive numbers', () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing.promptCost, `${model} promptCost`).toBeGreaterThan(0);
      expect(pricing.completionCost, `${model} completionCost`).toBeGreaterThan(0);
    }
  });
});
