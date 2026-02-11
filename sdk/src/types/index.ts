export interface ObserveAIConfig {
  apiKey: string;
  baseUrl?: string;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
  enabled?: boolean;
  metadata?: {
    userId?: string;
    sessionId?: string;
    endpoint?: string;
    tags?: string[];
  };
}

export interface LogEntry {
  timestamp?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
  totalCost: number;
  latencyMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  errorType?: string;
  prompt?: string;
  response?: string;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  tags?: string[];
  toolCalls?: ToolCallEntry[];
}

export interface ToolCallEntry {
  toolName: string;
  toolInput?: string;
  toolOutput?: string;
  latencyMs?: number;
  status?: string;
  errorMessage?: string;
}

export interface BatchPayload {
  requests: LogEntry[];
}
