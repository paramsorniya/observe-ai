import { ObserveAIClient } from '../core/client.js';
import { calculateCost } from '../core/pricing.js';
import type { ObserveAIConfig, ToolCallEntry } from '../types/index.js';

function classifyError(error: any): string {
  if (error?.status === 429) return 'rate_limit';
  if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') return 'timeout';
  if (error?.status >= 500) return 'server_error';
  if (error?.status === 400) return 'invalid_request';
  return 'api_error';
}

function extractToolCalls(response: any): ToolCallEntry[] {
  if (!Array.isArray(response?.content)) return [];
  return response.content
    .filter((block: any) => block.type === 'tool_use')
    .map((block: any) => ({
      toolName: block.name || 'unknown',
      toolInput: typeof block.input === 'string' ? block.input : JSON.stringify(block.input),
      status: 'called',
    }));
}

function extractTextContent(response: any): string {
  if (!Array.isArray(response?.content)) return '';
  return response.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');
}

export function wrapAnthropic(anthropic: any, config: ObserveAIConfig): any {
  if (!config.enabled && config.enabled !== undefined) return anthropic;

  const client = new ObserveAIClient(config);
  const original = anthropic.messages.create.bind(anthropic.messages);

  anthropic.messages.create = async function (params: any, ...args: any[]) {
    const start = Date.now();
    try {
      const response = await original(params, ...args);
      const latency = Date.now() - start;
      const promptTokens = response.usage?.input_tokens ?? 0;
      const completionTokens = response.usage?.output_tokens ?? 0;

      client.log({
        provider: 'anthropic',
        model: params.model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        totalCost: calculateCost(params.model, promptTokens, completionTokens),
        latencyMs: latency,
        status: 'success',
        prompt: JSON.stringify(params.messages).slice(0, 100000),
        response: extractTextContent(response).slice(0, 100000),
        toolCalls: extractToolCalls(response),
      });

      return response;
    } catch (error: any) {
      const latency = Date.now() - start;
      client.log({
        provider: 'anthropic',
        model: params.model,
        promptTokens: 0,
        completionTokens: 0,
        totalCost: 0,
        latencyMs: latency,
        status: 'error',
        errorMessage: error?.message || 'Unknown error',
        errorType: classifyError(error),
        prompt: JSON.stringify(params.messages).slice(0, 100000),
      });
      throw error;
    }
  };

  anthropic._observeai = client;
  return anthropic;
}
