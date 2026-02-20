import { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, ArrowRight, BarChart3, DollarSign, Shield } from 'lucide-react';

const highlights = [
  { icon: BarChart3, text: 'Real-time cost & usage dashboards' },
  { icon: DollarSign, text: 'Track spending across all AI models' },
  { icon: Shield, text: 'Error detection & alerting' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // All hooks must be declared before any conditional return
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Already logged in — redirect
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate(redirectTo);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Animated orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[15%] w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse-glow animation-delay-300" />
          <div className="absolute top-[60%] left-[50%] w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow animation-delay-600" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500 p-1.5">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">ObserveAI</span>
          </div>

          {/* Main messaging */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Full visibility into your{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI spending
              </span>
            </h1>
            <p className="text-lg text-blue-100/70 max-w-md">
              Monitor every API call, track costs in real-time, and optimize your AI operations.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 pt-4">
              {highlights.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <item.icon className="h-4 w-4 text-blue-300" />
                  </div>
                  <span className="text-sm text-blue-100/80">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <p className="text-sm text-blue-200/40">
            Trusted by 1,000+ developers worldwide
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="rounded-lg bg-primary p-1.5">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">ObserveAI</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? 'Signing in...' : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
