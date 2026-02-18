import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = () => {
      api.get('/user/profile')
        .then((res) => updateUser(res.data.user))
        .catch(() => {});
    };

    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [isAuthenticated, updateUser]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
