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

export function useCostBreakdown(projectId: string | null) {
  return useQuery({
    queryKey: ['cost-breakdown', projectId],
    queryFn: async () => {
      const res = await api.get('/stats/cost-breakdown', {
        params: { projectId },
      });
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useErrorStats(projectId: string | null) {
  return useQuery({
    queryKey: ['error-stats', projectId],
    queryFn: async () => {
      const res = await api.get('/stats/errors', {
        params: { projectId },
      });
      return res.data;
    },
    enabled: !!projectId,
  });
}
