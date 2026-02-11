import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ApiRequest, Pagination } from '@/types';

export interface RequestFilters {
  page?: number;
  limit?: number;
  status?: string;
  model?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface RequestsResponse {
  data: ApiRequest[];
  pagination: Pagination;
}

export function useRequests(
  projectId: string | null,
  filters: RequestFilters = {}
) {
  return useQuery<RequestsResponse>({
    queryKey: ['requests', projectId, filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {};

      if (projectId) params.projectId = projectId;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.status) params.status = filters.status;
      if (filters.model) params.model = filters.model;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/requests', { params });
      const raw = res.data;
      return {
        data: raw.requests ?? raw.data ?? [],
        pagination: raw.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}
