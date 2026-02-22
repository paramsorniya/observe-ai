import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAppStore } from '@/store/appStore';
import { TopNav } from '@/components/layout/TopNav';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Project } from '@/types';

export function DashboardLayout() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.projects ?? res.data;
    },
  });

  // Set initial project if none is selected, or reset if stale
  useEffect(() => {
    if (projects.length > 0) {
      const isValid = currentProjectId && projects.some((p) => p.id === currentProjectId);
      if (!isValid) {
        setCurrentProjectId(projects[0].id);
      }
    }
  }, [currentProjectId, projects, setCurrentProjectId]);

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <TopNav projects={projects} onProjectChange={setCurrentProjectId} />

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
