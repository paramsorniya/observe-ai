import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from '@/components/layout/AdminSidebar';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import UsersPage from '@/pages/UsersPage';
import UserDetailPage from '@/pages/UserDetailPage';
import RevenuePage from '@/pages/RevenuePage';
import SubscriptionsPage from '@/pages/SubscriptionsPage';
import SystemStatsPage from '@/pages/SystemStatsPage';

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/system" element={<SystemStatsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
