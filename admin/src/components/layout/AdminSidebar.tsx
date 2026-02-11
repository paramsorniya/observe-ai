import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, DollarSign, Activity, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/system', icon: Activity, label: 'System Stats' },
];

export default function AdminSidebar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">ObserveAI Admin</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
