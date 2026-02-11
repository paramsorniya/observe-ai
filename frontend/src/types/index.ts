export interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'active' | 'past_due' | 'canceled';
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  projectLimit: number;
  isAdmin: boolean;
  pendingDowngrade?: boolean;
  downgradeDate?: string;
  downgradeTo?: string;
}

export interface Project {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { requests: number };
}

export interface ApiRequest {
  id: string;
  projectId: string;
  timestamp: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
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
  tags: string[];
  toolCalls?: ToolCall[];
  _count?: { toolCalls: number };
}

export interface ToolCall {
  id: string;
  toolName: string;
  toolInput?: string;
  toolOutput?: string;
  latencyMs?: number;
  status: string;
  errorMessage?: string;
  timestamp: string;
}

export interface DashboardStats {
  today: {
    requests: number;
    cost: number;
    tokens: number;
    errors: number;
    avgLatency: number;
  };
  week: { cost: number };
  total: { requests: number; cost: number; errors: number };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
