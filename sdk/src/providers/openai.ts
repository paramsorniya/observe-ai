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
  const toolCalls = response?.choices?.[0]?.message?.tool_calls;
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls.map((tc: any) => ({
    toolName: tc.function?.name || tc.type || 'unknown',
    toolInput: typeof tc.function?.arguments === 'string'
      ? tc.function.arguments
      : JSON.stringify(tc.function?.arguments),
    status: 'called',
  }));
}

export function wrapOpenAI(openai: any, config: ObserveAIConfig): any {
  if (!config.enabled && config.enabled !== undefined) return openai;

  const client = new ObserveAIClient(config);
  const original = openai.chat.completions.create.bind(openai.chat.completions);

  openai.chat.completions.create = async function (params: any, ...args: any[]) {
    const start = Date.now();
    try {
      const response = await original(params, ...args);
      const latency = Date.now() - start;
      const promptTokens = response.usage?.prompt_tokens ?? 0;
      const completionTokens = response.usage?.completion_tokens ?? 0;

      client.log({
        provider: 'openai',
        model: params.model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        totalCost: calculateCost(params.model, promptTokens, completionTokens),
        latencyMs: latency,
        status: 'success',
        prompt: JSON.stringify(params.messages).slice(0, 100000),
        response: (response.choices?.[0]?.message?.content || '').slice(0, 100000),
        toolCalls: extractToolCalls(response),
      });

      return response;
    } catch (error: any) {
      const latency = Date.now() - start;
      client.log({
        provider: 'openai',
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

  // Attach shutdown for cleanup
  openai._observeai = client;
  return openai;
}
