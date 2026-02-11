import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  currentProjectId: string | null;
  sidebarOpen: boolean;
  setCurrentProjectId: (id: string | null) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      sidebarOpen: true,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'app-storage', partialize: (s) => ({ currentProjectId: s.currentProjectId }) }
  )
);
