import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  DollarSign,
  AlertTriangle,
  Clock,
  FolderPlus,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStats, useRequestTimeline, useCostBreakdown } from '@/hooks/useDashboardStats';
import { useRequests } from '@/hooks/useRequests';
import { useCreateProject } from '@/hooks/useProjects';
import { formatCost, formatNumber, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

/* ─── Metric Card ─────────────────────────────────────────────── */
function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor?: string;
  description?: string;
  accent?: 'teal' | 'amber' | 'red' | 'blue';
}) {
  const accentStyle: Record<string, string> = {
    teal: 'hsl(175 84% 32%)',
    amber: 'hsl(38 92% 50%)',
    red: 'hsl(0 62% 48%)',
    blue: 'hsl(220 84% 58%)',
  };

  return (
    <div
      className="obs-card p-5 flex flex-col gap-3"
      style={accent ? { borderLeft: `3px solid ${accentStyle[accent]}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </p>
        <div
          className="h-8 w-8 rounded-[8px] flex items-center justify-center"
          style={{
            background: accent ? `${accentStyle[accent]}18` : 'hsl(var(--muted))',
          }}
        >
          <Icon
            className="h-4 w-4"
            style={{ color: accent ? accentStyle[accent] : 'hsl(var(--muted-foreground))' }}
          />
        </div>
      </div>
      <div>
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Period Toggle ───────────────────────────────────────────── */
function PeriodToggle({
  value,
  onChange,
}: {
  value: '24h' | '7d';
  onChange: (v: '24h' | '7d') => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-[8px] p-0.5"
      style={{ background: 'hsl(var(--muted))' }}
    >
      {(['24h', '7d'] as const).map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={cn(
            'h-6 px-3 text-xs font-semibold rounded-[6px] transition-all duration-150',
            value === period
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

/* ─── Chart Tooltip ───────────────────────────────────────────── */
const ChartTooltipStyle = {
  contentStyle: {
    background: 'hsl(220 26% 14%)',
    border: '1px solid hsl(175 18% 18%)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'hsl(60 2% 95%)',
  },
  cursor: { stroke: 'hsl(175 84% 32% / 0.3)', strokeWidth: 1 },
};

/* ─── Empty chart placeholder ─────────────────────────────────── */
function EmptyChart({ height = 220 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      No data yet
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId);
  const createProject = useCreateProject();
  const user = useAuthStore((s) => s.user);

  const [timelinePeriod, setTimelinePeriod] = useState<'24h' | '7d'>('24h');

  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentProjectId);
  const { data: timeline, isLoading: timelineLoading } = useRequestTimeline(
    currentProjectId,
    timelinePeriod
  );
  const { data: costBreakdown, isLoading: costLoading } = useCostBreakdown(currentProjectId);
  const { data: requestsData, isLoading: requestsLoading } = useRequests(currentProjectId, {
    limit: 8,
  });

  const handleCreateProject = async () => {
    try {
      const project = await createProject.mutateAsync({ name: 'My First Project' });
      setCurrentProjectId(project.id);
    } catch {
      // handled by mutation
    }
  };

  if (!currentProjectId) {
    return (
      <EmptyState
        icon={FolderPlus}
        title="No project selected"
        description="Create your first project to start tracking AI API requests, costs, and performance."
        actionLabel="Create Project"
        onAction={handleCreateProject}
      />
    );
  }

  const usageRatio = user
    ? user.monthlyRequestCount / user.monthlyRequestLimit
    : 0;
  const usagePercent = Math.min(100, Math.round(usageRatio * 100));

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="obs-section-title text-2xl mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            AI API usage and performance overview
          </p>
        </div>
        {user && (
          <Badge
            variant={
              usageRatio >= 0.9
                ? 'destructive'
                : usageRatio >= 0.7
                  ? 'warning'
                  : 'ghost'
            }
            className="mt-1"
          >
            <Activity className="h-2.5 w-2.5" />
            {usagePercent}% used
          </Badge>
        )}
      </div>

      {statsLoading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <>
          {/* ── Row 1: Metric Cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Requests Today"
              value={formatNumber(stats?.today.requests ?? 0)}
              icon={Activity}
              accent="teal"
              description={`${formatNumber(stats?.total.requests ?? 0)} all-time`}
            />
            <MetricCard
              title="Cost Today"
              value={formatCost(stats?.today.cost ?? 0)}
              icon={DollarSign}
              accent="amber"
              description={`${formatCost(stats?.week.cost ?? 0)} this week`}
            />
            <MetricCard
              title="Errors Today"
              value={formatNumber(stats?.today.errors ?? 0)}
              icon={AlertTriangle}
              accent={
                (stats?.today.errors ?? 0) > 0 ? 'red' : 'teal'
              }
              description={
                stats?.today.requests && stats.today.requests > 0
                  ? `${((stats.today.errors / stats.today.requests) * 100).toFixed(1)}% error rate`
                  : `${formatNumber(stats?.total.errors ?? 0)} all-time`
              }
            />
            <MetricCard
              title="Avg Latency"
              value={`${Math.round(stats?.today.avgLatency ?? 0)}ms`}
              icon={Clock}
              accent="blue"
              description="today's average"
            />
          </div>

          {/* ── Row 2: Timeline (2/3) + Usage (1/3) ── */}
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Request Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Request Volume</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {timelinePeriod === '24h'
                        ? 'Last 24 hours'
                        : 'Last 7 days'}
                    </CardDescription>
                  </div>
                  <PeriodToggle value={timelinePeriod} onChange={setTimelinePeriod} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {timelineLoading ? (
                  <LoadingSpinner size="sm" />
                ) : timeline && timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(175 84% 32%)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(175 84% 32%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip {...ChartTooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="hsl(175 84% 36%)"
                        strokeWidth={2}
                        fill="url(#tealGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>

            {/* Monthly Usage */}
            {user && (
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Monthly Usage</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {new Date().toLocaleString('default', { month: 'long' })} quota
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  {/* Usage bar */}
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <p className="font-heading text-3xl font-bold text-foreground">
                        {usagePercent}
                        <span className="text-lg text-muted-foreground font-normal">%</span>
                      </p>
                      {usageRatio >= 0.9 && (
                        <Badge variant="destructive">Near limit</Badge>
                      )}
                      {usageRatio >= 0.7 && usageRatio < 0.9 && (
                        <Badge variant="warning">High usage</Badge>
                      )}
                    </div>

                    <div className="h-2 rounded-full overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${usagePercent}%`,
                          background:
                            usageRatio >= 0.9
                              ? 'hsl(var(--destructive))'
                              : usageRatio >= 0.7
                                ? 'hsl(var(--secondary))'
                                : 'hsl(var(--primary))',
                          boxShadow:
                            usageRatio < 0.9
                              ? '0 0 8px rgba(13,148,136,0.4)'
                              : undefined,
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Used</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatNumber(user.monthlyRequestCount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Limit</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatNumber(user.monthlyRequestLimit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {user.subscriptionTier === 'FREE' && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <p className="text-xs text-muted-foreground mb-2">
                        Get more requests and unlock advanced features
                      </p>
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => navigate('/dashboard/upgrade')}
                      >
                        <Zap className="h-3 w-3" />
                        Upgrade Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Row 3: Cost Chart (1/3) + Recent Requests (2/3) ── */}
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Daily Cost Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daily Cost</CardTitle>
                <CardDescription className="text-xs mt-0.5">Last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {costLoading ? (
                  <LoadingSpinner size="sm" />
                ) : costBreakdown?.dailyCost && costBreakdown.dailyCost.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={costBreakdown.dailyCost}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        {...ChartTooltipStyle}
                        formatter={(v: number) => [formatCost(v), 'Cost']}
                      />
                      <Bar
                        dataKey="cost"
                        fill="hsl(38 92% 50%)"
                        radius={[4, 4, 0, 0]}
                        opacity={0.85}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>

            {/* Recent Requests Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Recent Requests
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Last 8 API calls
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate('/dashboard/requests')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-0 pb-0">
                {requestsLoading ? (
                  <LoadingSpinner size="sm" />
                ) : requestsData?.data && requestsData.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="obs-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Model</th>
                          <th className="obs-num">Tokens</th>
                          <th className="obs-num">Cost</th>
                          <th className="obs-num">Latency</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestsData.data.map((req) => (
                          <tr
                            key={req.id}
                            className="cursor-pointer"
                            onClick={() => navigate('/dashboard/requests')}
                          >
                            <td className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(req.timestamp)}
                            </td>
                            <td>
                              <Badge variant="ghost">{req.model}</Badge>
                            </td>
                            <td className="obs-num text-sm">
                              {formatNumber(req.totalTokens)}
                            </td>
                            <td className="obs-num text-sm">
                              {formatCost(req.totalCost)}
                            </td>
                            <td className="obs-num text-sm">
                              {req.latencyMs}ms
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'obs-dot',
                                    req.status === 'success'
                                      ? 'obs-dot-success'
                                      : 'obs-dot-error'
                                  )}
                                />
                                <span className="text-xs capitalize">
                                  {req.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No requests recorded yet.{' '}
                    <a
                      href="https://docs.observeai.dev"
                      className="text-primary underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      See integration docs
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
