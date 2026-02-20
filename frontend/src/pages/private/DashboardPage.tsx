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
import { Activity, DollarSign, AlertTriangle, Clock, FolderPlus } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStats, useRequestTimeline, useCostBreakdown } from '@/hooks/useDashboardStats';
import { useRequests } from '@/hooks/useRequests';
import { useCreateProject } from '@/hooks/useProjects';
import { formatCost, formatNumber, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId);
  const createProject = useCreateProject();
  const user = useAuthStore((s) => s.user);

  const [timelinePeriod, setTimelinePeriod] = useState<'24h' | '7d'>('24h');

  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentProjectId);
  const { data: timeline, isLoading: timelineLoading } = useRequestTimeline(currentProjectId, timelinePeriod);
  const { data: costBreakdown, isLoading: costLoading } = useCostBreakdown(currentProjectId);
  const { data: requestsData, isLoading: requestsLoading } = useRequests(currentProjectId, { limit: 10 });

  const handleCreateProject = async () => {
    try {
      const project = await createProject.mutateAsync({ name: 'My First Project' });
      setCurrentProjectId(project.id);
    } catch {
      // Error handled by mutation
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI API usage and performance
        </p>
      </div>

      {statsLoading ? <LoadingSpinner size="lg" /> : (<>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Requests Today"
          value={formatNumber(stats?.today.requests ?? 0)}
          icon={Activity}
          description={`${formatNumber(stats?.total.requests ?? 0)} all-time`}
        />
        <StatsCard
          title="Cost Today"
          value={formatCost(stats?.today.cost ?? 0)}
          icon={DollarSign}
          description={`${formatCost(stats?.week.cost ?? 0)} this week`}
        />
        <StatsCard
          title="Errors Today"
          value={formatNumber(stats?.today.errors ?? 0)}
          icon={AlertTriangle}
          description={
            stats?.today.requests && stats.today.requests > 0
              ? `${((stats.today.errors / stats.today.requests) * 100).toFixed(1)}% error rate`
              : `${formatNumber(stats?.total.errors ?? 0)} all-time`
          }
        />
        <StatsCard
          title="Avg Latency"
          value={`${Math.round(stats?.today.avgLatency ?? 0)}ms`}
          icon={Clock}
          description="today's average"
        />
      </div>

      {/* Monthly usage bar */}
      {user && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Monthly Request Usage</p>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">
                  <span className="font-bold">{formatNumber(user.monthlyRequestCount)}</span>
                  <span className="text-muted-foreground"> / {formatNumber(user.monthlyRequestLimit)}</span>
                </span>
                {user.monthlyRequestCount / user.monthlyRequestLimit >= 0.9 && (
                  <Badge variant="destructive" className="text-xs">Near limit</Badge>
                )}
                {user.monthlyRequestCount / user.monthlyRequestLimit >= 0.7 &&
                  user.monthlyRequestCount / user.monthlyRequestLimit < 0.9 && (
                  <Badge variant="warning" className="text-xs">High usage</Badge>
                )}
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  user.monthlyRequestCount / user.monthlyRequestLimit >= 0.9
                    ? 'bg-destructive'
                    : user.monthlyRequestCount / user.monthlyRequestLimit >= 0.7
                    ? 'bg-yellow-500'
                    : 'bg-primary'
                )}
                style={{
                  width: `${Math.min((user.monthlyRequestCount / user.monthlyRequestLimit) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {Math.round((user.monthlyRequestCount / user.monthlyRequestLimit) * 100)}% of monthly limit used
              {user.subscriptionTier === 'FREE' && (
                <> — <a href="/dashboard/upgrade" className="text-primary underline hover:no-underline">Upgrade</a> to get more requests</>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Request Volume</CardTitle>
                <CardDescription>
                  {timelinePeriod === '24h' ? 'Requests over the last 24 hours' : 'Requests over the last 7 days'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30 shrink-0">
                <Button
                  size="sm"
                  variant={timelinePeriod === '24h' ? 'default' : 'ghost'}
                  className="h-7 px-3 text-xs"
                  onClick={() => setTimelinePeriod('24h')}
                >
                  24h
                </Button>
                <Button
                  size="sm"
                  variant={timelinePeriod === '7d' ? 'default' : 'ghost'}
                  className="h-7 px-3 text-xs"
                  onClick={() => setTimelinePeriod('7d')}
                >
                  7d
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <LoadingSpinner size="sm" />
            ) : timeline && timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No request data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Cost (7 days)</CardTitle>
            <CardDescription>Cost breakdown by day</CardDescription>
          </CardHeader>
          <CardContent>
            {costLoading ? (
              <LoadingSpinner size="sm" />
            ) : costBreakdown?.dailyCost && costBreakdown.dailyCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBreakdown.dailyCost}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCost(value), 'Cost']}
                  />
                  <Bar
                    dataKey="cost"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No cost data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Requests</CardTitle>
            <CardDescription>Last 10 API requests</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/requests')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <LoadingSpinner size="sm" />
          ) : requestsData?.data && requestsData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Time</th>
                    <th className="pb-3 font-medium text-muted-foreground">Model</th>
                    <th className="pb-3 font-medium text-muted-foreground">Tokens</th>
                    <th className="pb-3 font-medium text-muted-foreground">Cost</th>
                    <th className="pb-3 font-medium text-muted-foreground">Latency</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsData.data.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate('/dashboard/requests')}
                    >
                      <td className="py-3 whitespace-nowrap">{formatDate(req.timestamp)}</td>
                      <td className="py-3">
                        <Badge variant="secondary">{req.model}</Badge>
                      </td>
                      <td className="py-3">{formatNumber(req.totalTokens)}</td>
                      <td className="py-3">{formatCost(req.totalCost)}</td>
                      <td className="py-3">{req.latencyMs}ms</td>
                      <td className="py-3">
                        <Badge variant={req.status === 'success' ? 'success' : 'destructive'}>
                          {req.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No requests recorded yet. Integrate your API to start logging.
            </div>
          )}
        </CardContent>
      </Card>
      </>)}
    </div>
  );
}
