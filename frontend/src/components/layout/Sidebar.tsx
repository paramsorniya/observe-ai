import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Wrench,
  Settings,
  Lock,
  Activity,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { canAccessFeature } from '@/lib/features';
import { cn } from '@/lib/utils';

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
  {
    label: 'Optimization',
    path: '/dashboard/optimization',
    icon: Lightbulb,
    feature: 'cost_optimization',
  },
  {
    label: 'Tool Tracking',
    path: '/dashboard/tools',
    icon: Wrench,
    feature: 'tool_tracking',
  },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  { label: 'Docs', path: '/dashboard/docs', icon: BookOpen },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const tier = user?.subscriptionTier;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-card border-r transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
      )}
    >
      {/* Branding */}
      <div className="flex items-center gap-2 h-16 px-6 border-b shrink-0">
        <Activity className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">ObserveAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const locked =
              item.feature != null && !canAccessFeature(tier, item.feature);

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {locked && (
                    <Lock className="h-3.5 w-3.5 ml-auto text-muted-foreground/60" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
