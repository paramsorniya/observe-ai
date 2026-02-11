import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import DashboardPage from './pages/private/DashboardPage';
import RequestsPage from './pages/private/RequestsPage';
import CostsPage from './pages/private/CostsPage';
import ErrorsPage from './pages/private/ErrorsPage';
import OptimizationPage from './pages/private/OptimizationPage';
import ToolTrackingPage from './pages/private/ToolTrackingPage';
import SettingsPage from './pages/private/SettingsPage';
import UpgradePage from './pages/private/UpgradePage';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/requests" element={<RequestsPage />} />
          <Route path="/dashboard/costs" element={<CostsPage />} />
          <Route path="/dashboard/errors" element={<ErrorsPage />} />
          <Route path="/dashboard/optimization" element={<OptimizationPage />} />
          <Route path="/dashboard/tools" element={<ToolTrackingPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/upgrade" element={<UpgradePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
