import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Wrench,
  Settings,
  BookOpen,
  Users,
  ChevronDown,
  Check,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Lock,
  Activity,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { useProjects } from '@/hooks/useProjects';
import { canAccessFeature } from '@/lib/features';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface TopNavProps {
  projects: Project[];
  onProjectChange: (id: string) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  feature?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Requests', path: '/dashboard/requests', icon: FileText },
  { label: 'Costs', path: '/dashboard/costs', icon: DollarSign },
  { label: 'Errors', path: '/dashboard/errors', icon: AlertTriangle },
  { label: 'Optimization', path: '/dashboard/optimization', icon: Lightbulb, feature: 'cost_optimization' },
  { label: 'Tools', path: '/dashboard/tools', icon: Wrench, feature: 'tool_tracking' },
  { label: 'Team', path: '/dashboard/team', icon: Users, feature: 'team_collaboration' },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  { label: 'Docs', path: '/dashboard/docs', icon: BookOpen },
];

const TIER_LABEL: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Pro Plus',
  ENTERPRISE: 'Enterprise',
};

const TIER_BADGE: Record<string, 'ghost' | 'default' | 'success' | 'warning'> = {
  FREE: 'ghost',
  STARTER: 'default',
  PRO: 'success',
  ENTERPRISE: 'warning',
};

export function TopNav({ projects, onProjectChange }: TopNavProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [projectOpen, setProjectOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const projectRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  const { data: projectsData } = useProjects();
  const allProjects = (projectsData as any)?.projects ?? projectsData ?? [];
  const currentProject = projects.find((p) => p.id === currentProjectId)
    ?? allProjects.find((p: any) => p.id === currentProjectId);
  const isSharedProject = currentProject?.isOwner === false;

  const tier = user?.subscriptionTier ?? 'FREE';
  const SHARED_UNLOCKED = ['team_collaboration', 'cost_optimization', 'tool_tracking'];

  const usagePercent = user
    ? Math.min(100, Math.round((user.monthlyRequestCount / user.monthlyRequestLimit) * 100))
    : 0;

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) setProjectOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [currentProjectId]);

  const initials = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();
  const displayName = user?.name ?? user?.email ?? '';

  return (
    <>
      <header
        className="relative z-30 sticky top-0"
        style={{
          background: 'hsl(var(--background) / 0.85)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid hsl(var(--border))',
          boxShadow: '0 1px 0 rgba(13,148,136,0.08)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="flex items-center h-14 gap-2">

            {/* ── Logo ── */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 shrink-0 mr-4 group"
            >
              <div className="relative">
                <Activity
                  className="h-5 w-5 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(13,148,136,0.7)]"
                />
              </div>
              <span className="font-heading font-bold text-base text-foreground tracking-tight hidden sm:block">
                Observe<span className="text-primary">AI</span>
              </span>
            </Link>

            {/* ── Nav Items (desktop) ── */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const locked =
                  item.feature != null &&
                  !canAccessFeature(tier, item.feature) &&
                  !(isSharedProject && SHARED_UNLOCKED.includes(item.feature));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        'obs-nav-link text-xs',
                        isActive && 'active',
                        locked && 'opacity-50'
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {locked && <Lock className="h-2.5 w-2.5 ml-0.5 opacity-60" />}
                  </NavLink>
                );
              })}
            </nav>

            {/* ── Right Side Controls ── */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Project Selector */}
              <div className="relative hidden sm:block" ref={projectRef}>
                <button
                  onClick={() => setProjectOpen((o) => !o)}
                  className={cn(
                    'flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-medium',
                    'border border-border bg-card',
                    'text-muted-foreground hover:text-foreground hover:border-primary/30',
                    'transition-all duration-200',
                    'max-w-[180px]'
                  )}
                >
                  {isSharedProject && <Users className="h-3 w-3 text-primary shrink-0" />}
                  <span className="truncate">{currentProject?.name ?? 'Select project'}</span>
                  <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 opacity-50 transition-transform duration-200', projectOpen && 'rotate-180')} />
                </button>

                {projectOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 w-64 rounded-[12px] border border-border overflow-hidden z-50"
                    style={{
                      background: 'hsl(var(--card))',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(13,148,136,0.15)',
                    }}
                  >
                    {projects.some((p) => p.isOwner) && (
                      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                        My Projects
                      </p>
                    )}
                    {projects.filter((p) => p.isOwner).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { onProjectChange(p.id); setProjectOpen(false); }}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 text-sm text-left',
                          'transition-colors hover:bg-primary/8',
                          p.id === currentProjectId ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        <span className="truncate flex-1">{p.name}</span>
                        {p.id === currentProjectId && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </button>
                    ))}
                    {projects.some((p) => !p.isOwner) && (
                      <>
                        <div className="my-1 mx-3 border-t border-border/50" />
                        <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                          Shared with me
                        </p>
                        {projects.filter((p) => !p.isOwner).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { onProjectChange(p.id); setProjectOpen(false); }}
                            className={cn(
                              'flex items-center gap-2 w-full px-3 py-2 text-sm text-left',
                              'transition-colors hover:bg-primary/8',
                              p.id === currentProjectId ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            <Users className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate flex-1">{p.name}</span>
                            {p.id === currentProjectId && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                          </button>
                        ))}
                      </>
                    )}
                    {projects.length === 0 && (
                      <p className="px-3 py-3 text-sm text-muted-foreground">No projects yet</p>
                    )}
                    <div className="p-2 pt-1 border-t border-border/40 mt-1">
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setProjectOpen(false)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-primary rounded-[6px] hover:bg-primary/8 transition-colors"
                      >
                        <Settings className="h-3 w-3" />
                        Manage projects
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Tier Badge */}
              {user && (
                <Badge
                  variant={TIER_BADGE[tier] ?? 'ghost'}
                  className="hidden md:inline-flex"
                >
                  {tier === 'FREE' && <Zap className="h-2.5 w-2.5" />}
                  {TIER_LABEL[tier] ?? tier}
                </Badge>
              )}

              {/* Usage Bar */}
              {user && (
                <div className="hidden xl:flex items-center gap-2">
                  <div
                    className="w-20 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'hsl(var(--muted))' }}
                    title={`${user.monthlyRequestCount.toLocaleString()} / ${user.monthlyRequestLimit.toLocaleString()} requests`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usagePercent}%`,
                        background: usagePercent >= 90
                          ? 'hsl(var(--destructive))'
                          : usagePercent >= 70
                            ? 'hsl(var(--secondary))'
                            : 'hsl(var(--primary))',
                        boxShadow: usagePercent < 90
                          ? '0 0 6px rgba(13,148,136,0.5)'
                          : undefined,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {usagePercent}%
                  </span>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-[8px]',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-accent transition-colors duration-200'
                )}
              >
                <ThemeIcon className="h-4 w-4" />
              </button>

              {/* User Menu */}
              <div className="relative hidden sm:block" ref={userRef}>
                <button
                  onClick={() => setUserOpen((o) => !o)}
                  className={cn(
                    'flex items-center gap-2 h-8 px-2 rounded-[8px]',
                    'hover:bg-accent transition-colors duration-200'
                  )}
                >
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(175 84% 42%))',
                      boxShadow: '0 0 0 2px hsl(var(--primary) / 0.2)',
                    }}
                  >
                    {initials}
                  </div>
                  <span className="hidden lg:block text-xs font-medium text-foreground max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', userOpen && 'rotate-180')} />
                </button>

                {userOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-[12px] border border-border overflow-hidden z-50"
                    style={{
                      background: 'hsl(var(--card))',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(13,148,136,0.15)',
                    }}
                  >
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground rounded-[8px] hover:bg-primary/8 hover:text-primary transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <Link
                        to="/dashboard/upgrade"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground rounded-[8px] hover:bg-primary/8 hover:text-primary transition-colors"
                      >
                        <Zap className="h-4 w-4" />
                        Upgrade Plan
                      </Link>
                      <div className="my-1 border-t border-border/40" />
                      <button
                        onClick={() => { setUserOpen(false); logout(); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive rounded-[8px] hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <div className="relative lg:flex hidden sm:hidden" ref={mobileRef}>
                {/* This is the mobile case for tablet-and-below nav */}
              </div>
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className={cn(
                  'lg:hidden h-8 w-8 flex items-center justify-center rounded-[8px]',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  'transition-colors duration-200'
                )}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Nav Dropdown ── */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t border-border"
            style={{ background: 'hsl(var(--card))' }}
          >
            <div className="max-w-[1440px] mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const locked =
                  item.feature != null &&
                  !canAccessFeature(tier, item.feature) &&
                  !(isSharedProject && SHARED_UNLOCKED.includes(item.feature));
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium',
                        'transition-colors duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                        locked && 'opacity-50'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {locked && <Lock className="h-3 w-3 ml-auto opacity-60" />}
                  </NavLink>
                );
              })}

              {/* Mobile project selector */}
              <div className="pt-2 border-t border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] px-3 pb-1">
                  Projects
                </p>
                {projects.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onProjectChange(p.id); setMobileOpen(false); }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-[8px]',
                      'transition-colors hover:bg-accent',
                      p.id === currentProjectId ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {!p.isOwner && <Users className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    <span className="truncate flex-1 text-left">{p.name}</span>
                    {p.id === currentProjectId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Mobile user info */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(175 84% 42%))' }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{user?.name ?? user?.email}</p>
                    <Badge variant={TIER_BADGE[tier] ?? 'ghost'} className="mt-0.5">{TIER_LABEL[tier]}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={cycleTheme} className="h-8 w-8 flex items-center justify-center rounded-[8px] text-muted-foreground hover:bg-accent">
                    <ThemeIcon className="h-4 w-4" />
                  </button>
                  <button onClick={logout} className="h-8 w-8 flex items-center justify-center rounded-[8px] text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shared project banner */}
        {isSharedProject && (
          <div
            className="border-t px-6 py-2 flex items-center gap-2 text-xs"
            style={{
              borderColor: 'hsl(var(--primary) / 0.2)',
              background: 'hsl(var(--primary) / 0.06)',
              color: 'hsl(var(--primary))',
            }}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              Viewing shared project — <strong>{currentProject?.name}</strong>. Your account, settings, and own projects are separate.
            </span>
          </div>
        )}
      </header>
    </>
  );
}
