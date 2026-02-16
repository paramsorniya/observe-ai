import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Check,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface HeaderProps {
  projects: Project[];
  onProjectChange: (id: string) => void;
}

const tierVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  FREE: 'secondary',
  STARTER: 'default',
  PRO: 'success',
  ENTERPRISE: 'warning',
};

export function Header({ projects, onProjectChange }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const projectRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const usagePercent = user
    ? Math.min(
        100,
        Math.round(
          (user.monthlyRequestCount / user.monthlyRequestLimit) * 100
        )
      )
    : 0;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        projectRef.current &&
        !projectRef.current.contains(e.target as Node)
      ) {
        setProjectDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Hamburger */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Project Selector */}
      <div className="relative" ref={projectRef}>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 max-w-[200px]"
          onClick={() => setProjectDropdownOpen((o) => !o)}
        >
          <span className="truncate">
            {currentProject?.name ?? 'Select project'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {projectDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-56 rounded-md border bg-popover p-1 shadow-md z-50">
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No projects
              </p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent',
                    project.id === currentProjectId && 'bg-accent'
                  )}
                  onClick={() => {
                    onProjectChange(project.id);
                    setProjectDropdownOpen(false);
                  }}
                >
                  <span className="truncate flex-1 text-left">
                    {project.name}
                  </span>
                  {project.id === currentProjectId && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Plan Badge */}
      {user && (
        <Badge variant={tierVariant[user.subscriptionTier] ?? 'secondary'}>
          {user.subscriptionTier}
        </Badge>
      )}

      {/* Usage Bar */}
      {user && (
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {user.monthlyRequestCount.toLocaleString()} /{' '}
            {user.monthlyRequestLimit.toLocaleString()}
          </span>
          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePercent >= 90
                  ? 'bg-destructive'
                  : usagePercent >= 70
                    ? 'bg-yellow-500'
                    : 'bg-primary'
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        title={`Theme: ${theme}`}
      >
        <ThemeIcon className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* User Dropdown */}
      <div className="relative ml-auto md:ml-0" ref={userRef}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setUserDropdownOpen((o) => !o)}
        >
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="hidden lg:inline-block max-w-[120px] truncate text-sm">
            {user?.name ?? user?.email}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>

        {userDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 rounded-md border bg-popover shadow-md z-50">
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-medium truncate">
                {user?.name ?? 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <div className="p-1">
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-2 w-full rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
                onClick={() => setUserDropdownOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                className="flex items-center gap-2 w-full rounded-sm px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
