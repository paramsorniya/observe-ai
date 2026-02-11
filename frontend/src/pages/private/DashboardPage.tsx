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
import { useDashboardStats, useRequestTimeline, useCostBreakdown } from '@/hooks/useDashboardStats';
import { useRequests } from '@/hooks/useRequests';
import { useCreateProject } from '@/hooks/useProjects';
import { formatCost, formatNumber, formatDate } from '@/lib/utils';
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

  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentProjectId);
  const { data: timeline, isLoading: timelineLoading } = useRequestTimeline(currentProjectId, '24h');
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

  if (statsLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI API usage and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Requests Today"
          value={formatNumber(stats?.today.requests ?? 0)}
          icon={Activity}
          description={`${formatNumber(stats?.total.requests ?? 0)} total`}
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
          description={`${formatNumber(stats?.total.errors ?? 0)} total`}
        />
        <StatsCard
          title="Avg Latency"
          value={`${Math.round(stats?.today.avgLatency ?? 0)}ms`}
          icon={Clock}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Volume (24h)</CardTitle>
            <CardDescription>Requests over the last 24 hours</CardDescription>
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
    </div>
  );
}
