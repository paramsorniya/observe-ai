export { ObserveAIClient } from './core/client.js';
export { calculateCost } from './core/pricing.js';
export { wrapOpenAI } from './providers/openai.js';
export { wrapAnthropic } from './providers/anthropic.js';
export { wrapGemini } from './providers/gemini.js';
export type { ObserveAIConfig, LogEntry, ToolCallEntry, BatchPayload } from './types/index.js';

import { wrapOpenAI } from './providers/openai.js';
import { wrapAnthropic } from './providers/anthropic.js';
import { wrapGemini } from './providers/gemini.js';

export const ObserveAI = {
  wrap: wrapOpenAI,
  wrapAnthropic,
  wrapGemini,
};
