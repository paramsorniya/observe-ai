import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DashboardStats } from '@/types';

export function useDashboardStats(projectId: string | null) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', projectId],
    queryFn: async () => {
      const res = await api.get('/stats/dashboard', {
        params: { projectId },
      });
      return res.data;
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useRequestTimeline(
  projectId: string | null,
  period: string = '7d'
) {
  return useQuery({
    queryKey: ['request-timeline', projectId, period],
    queryFn: async () => {
      const res = await api.get('/stats/requests-timeline', {
        params: { projectId, period },
      });
      return res.data.timeline ?? res.data;
    },
    enabled: !!projectId,
  });
}

export function useCostBreakdown(projectId: string | null, period: number = 7) {
  return useQuery({
    queryKey: ['cost-breakdown', projectId, period],
    queryFn: async () => {
      const res = await api.get('/stats/cost-breakdown', {
        params: { projectId, period },
      });
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useToolStats(
  projectId: string | null,
  options: { period?: number; page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: ['tool-stats', projectId, options],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (projectId) params.projectId = projectId;
      if (options.period) params.period = options.period;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      const res = await api.get('/stats/tools', { params });
      return res.data;
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export interface ErrorFilters {
  period?: number;
  model?: string;
  errorType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useErrorStats(projectId: string | null, filters: ErrorFilters = {}) {
  return useQuery({
    queryKey: ['error-stats', projectId, filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (projectId) params.projectId = projectId;
      if (filters.period) params.period = filters.period;
      if (filters.model) params.model = filters.model;
      if (filters.errorType) params.errorType = filters.errorType;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const res = await api.get('/stats/errors', { params });
      return res.data;
    },
    enabled: !!projectId,
  });
}
