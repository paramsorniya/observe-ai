import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAppStore } from '@/store/appStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

export function DashboardLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId);

  const {
    data: projects = [],
    isLoading,
  } = useQuery<Project[]>({
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

  const handleProjectChange = (id: string) => {
    setCurrentProjectId(id);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        <Header projects={projects} onProjectChange={handleProjectChange} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
