import { ObserveAIClient } from '../core/client.js';
import { calculateCost } from '../core/pricing.js';
import type { ObserveAIConfig } from '../types/index.js';

function classifyError(error: any): string {
  if (error?.status === 429) return 'rate_limit';
  if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') return 'timeout';
  if (error?.status >= 500) return 'server_error';
  if (error?.status === 400) return 'invalid_request';
  return 'api_error';
}

function promptToString(prompt: any): string {
  if (typeof prompt === 'string') return prompt.slice(0, 100000);
  return JSON.stringify(prompt).slice(0, 100000);
}

export function wrapGemini(genAI: any, config: ObserveAIConfig): any {
  if (!config.enabled && config.enabled !== undefined) return genAI;

  const client = new ObserveAIClient(config);
  const originalGetModel = genAI.getGenerativeModel.bind(genAI);

  genAI.getGenerativeModel = function (params: any, ...args: any[]) {
    const model = originalGetModel(params, ...args);
    const modelName: string = params.model || 'gemini-2.0-flash';

    // Wrap generateContent
    const originalGenerate = model.generateContent.bind(model);
    model.generateContent = async function (prompt: any, ...rest: any[]) {
      const start = Date.now();
      try {
        const result = await originalGenerate(prompt, ...rest);
        const latency = Date.now() - start;
        const usage = result.response?.usageMetadata;
        const promptTokens = usage?.promptTokenCount ?? 0;
        const completionTokens = usage?.candidatesTokenCount ?? 0;

        client.log({
          provider: 'gemini',
          model: modelName,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          totalCost: calculateCost(modelName, promptTokens, completionTokens),
          latencyMs: latency,
          status: 'success',
          prompt: promptToString(prompt),
          response: (result.response?.text?.() ?? '').slice(0, 100000),
        });

        return result;
      } catch (error: any) {
        const latency = Date.now() - start;
        client.log({
          provider: 'gemini',
          model: modelName,
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
          latencyMs: latency,
          status: 'error',
          errorMessage: error?.message || 'Unknown error',
          errorType: classifyError(error),
          prompt: promptToString(prompt),
        });
        throw error;
      }
    };

    // Wrap generateContentStream
    const originalStream = model.generateContentStream.bind(model);
    model.generateContentStream = async function (prompt: any, ...rest: any[]) {
      const start = Date.now();
      try {
        const result = await originalStream(prompt, ...rest);
        // Wrap the response to capture usage after stream completes
        const originalResponse = result.response;
        result.response = originalResponse.then
          ? originalResponse.then(async (res: any) => {
              const latency = Date.now() - start;
              const usage = res?.usageMetadata;
              const promptTokens = usage?.promptTokenCount ?? 0;
              const completionTokens = usage?.candidatesTokenCount ?? 0;

              client.log({
                provider: 'gemini',
                model: modelName,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
                totalCost: calculateCost(modelName, promptTokens, completionTokens),
                latencyMs: latency,
                status: 'success',
                prompt: promptToString(prompt),
              });

              return res;
            })
          : originalResponse;

        return result;
      } catch (error: any) {
        const latency = Date.now() - start;
        client.log({
          provider: 'gemini',
          model: modelName,
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
          latencyMs: latency,
          status: 'error',
          errorMessage: error?.message || 'Unknown error',
          errorType: classifyError(error),
          prompt: promptToString(prompt),
        });
        throw error;
      }
    };

    return model;
  };

  genAI._observeai = client;
  return genAI;
}
