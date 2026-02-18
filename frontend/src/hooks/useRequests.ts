import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ApiRequest, Pagination } from '@/types';

export interface RequestFilters {
  page?: number;
  limit?: number;
  status?: string;
  model?: string;
  provider?: string;
  search?: string;
  fromDate?: string;   // YYYY-MM-DD
  toDate?: string;     // YYYY-MM-DD
  sortBy?: 'timestamp' | 'totalCost' | 'latencyMs' | 'totalTokens';
  sortOrder?: 'asc' | 'desc';
}

interface RequestsResponse {
  data: ApiRequest[];
  pagination: Pagination;
}

export interface RequestStats {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  avgLatency: number;
  errorCount: number;
  errorRate: number;
}

function toStartDatetime(date: string) {
  return `${date}T00:00:00.000Z`;
}
function toEndDatetime(date: string) {
  return `${date}T23:59:59.999Z`;
}

export function useRequests(projectId: string | null, filters: RequestFilters = {}) {
  return useQuery<RequestsResponse>({
    queryKey: ['requests', projectId, filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {};

      if (projectId) params.projectId = projectId;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.status) params.status = filters.status;
      if (filters.model) params.model = filters.model;
      if (filters.provider) params.provider = filters.provider;
      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.startDate = toStartDatetime(filters.fromDate);
      if (filters.toDate) params.endDate = toEndDatetime(filters.toDate);
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

      const res = await api.get('/requests', { params });
      const raw = res.data;
      return {
        data: raw.requests ?? raw.data ?? [],
        pagination: raw.pagination ?? { page: 1, limit: 100, total: 0, totalPages: 0 },
      };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useRequestStats(projectId: string | null, filters: Omit<RequestFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>) {
  return useQuery<RequestStats>({
    queryKey: ['request-stats', projectId, filters],
    queryFn: async () => {
      const params: Record<string, string> = {};

      if (projectId) params.projectId = projectId;
      if (filters.status) params.status = filters.status;
      if (filters.model) params.model = filters.model;
      if (filters.provider) params.provider = filters.provider;
      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.startDate = toStartDatetime(filters.fromDate);
      if (filters.toDate) params.endDate = toEndDatetime(filters.toDate);

      const res = await api.get('/requests/stats', { params });
      return res.data;
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}
