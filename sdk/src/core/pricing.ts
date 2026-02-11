const MODEL_PRICING: Record<string, { promptCost: number; completionCost: number }> = {
  'gpt-4': { promptCost: 0.03, completionCost: 0.06 },
  'gpt-4-turbo': { promptCost: 0.01, completionCost: 0.03 },
  'gpt-4o': { promptCost: 0.005, completionCost: 0.015 },
  'gpt-4o-mini': { promptCost: 0.00015, completionCost: 0.0006 },
  'gpt-3.5-turbo': { promptCost: 0.0005, completionCost: 0.0015 },
  'claude-3-opus': { promptCost: 0.015, completionCost: 0.075 },
  'claude-3-sonnet': { promptCost: 0.003, completionCost: 0.015 },
  'claude-3-haiku': { promptCost: 0.00025, completionCost: 0.00125 },
  'claude-3.5-sonnet': { promptCost: 0.003, completionCost: 0.015 },
};

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (promptTokens / 1000) * pricing.promptCost + (completionTokens / 1000) * pricing.completionCost;
}
