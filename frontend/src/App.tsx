import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/private/DashboardPage'));
const RequestsPage = lazy(() => import('./pages/private/RequestsPage'));
const CostsPage = lazy(() => import('./pages/private/CostsPage'));
const ErrorsPage = lazy(() => import('./pages/private/ErrorsPage'));
const OptimizationPage = lazy(() => import('./pages/private/OptimizationPage'));
const ToolTrackingPage = lazy(() => import('./pages/private/ToolTrackingPage'));
const SettingsPage = lazy(() => import('./pages/private/SettingsPage'));
const UpgradePage = lazy(() => import('./pages/private/UpgradePage'));
const UpgradeSuccessPage = lazy(() => import('./pages/private/UpgradeSuccessPage'));
const DocsPage = lazy(() => import('./pages/private/DocsPage'));
const TeamPage = lazy(() => import('./pages/private/TeamPage'));
const AcceptInvitePage = lazy(() => import('./pages/public/AcceptInvitePage'));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/requests" element={<RequestsPage />} />
            <Route path="/dashboard/costs" element={<CostsPage />} />
            <Route path="/dashboard/errors" element={<ErrorsPage />} />
            <Route path="/dashboard/optimization" element={<OptimizationPage />} />
            <Route path="/dashboard/tools" element={<ToolTrackingPage />} />
            <Route path="/dashboard/team" element={<TeamPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/upgrade" element={<UpgradePage />} />
            <Route path="/dashboard/upgrade/success" element={<UpgradeSuccessPage />} />
            <Route path="/dashboard/docs" element={<DocsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
