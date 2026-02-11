import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DollarSign } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useCostBreakdown } from '@/hooks/useDashboardStats';
import { formatCost, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const CHART_COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
];

export default function CostsPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const { data: costBreakdown, isLoading } = useCostBreakdown(currentProjectId);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!costBreakdown) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No cost data available"
        description="Cost data will appear once you start making AI API requests through your project."
      />
    );
  }

  const dailyCost = costBreakdown.dailyCost ?? [];
  const costByModel = costBreakdown.costByModel ?? [];
  const topRequests = costBreakdown.topRequests ?? [];
  const totalWeekCost = dailyCost.reduce(
    (sum: number, d: { cost: number }) => sum + d.cost,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cost Analytics</h1>
        <p className="text-muted-foreground">
          Track and analyze your AI API spending
        </p>
      </div>

      {/* Cost Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Total Cost (7 days)</CardTitle>
            <CardDescription>Aggregated spend across all models</CardDescription>
          </div>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCost(totalWeekCost)}</div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Cost Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Cost Trend</CardTitle>
            <CardDescription>Cost per day over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyCost}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCost(value), 'Cost']}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No daily cost data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost by Model Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost by Model</CardTitle>
            <CardDescription>Spending distribution across models</CardDescription>
          </CardHeader>
          <CardContent>
            {costByModel.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costByModel}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="cost"
                    nameKey="model"
                    label={({ model, percent }: { model: string; percent: number }) =>
                      `${model} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine
                  >
                    {costByModel.map((_: unknown, index: number) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCost(value), 'Cost']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No model cost data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Expensive Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Most Expensive Requests</CardTitle>
          <CardDescription>
            Individual requests with the highest cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">#</th>
                    <th className="pb-3 font-medium text-muted-foreground">Model</th>
                    <th className="pb-3 font-medium text-muted-foreground">Total Tokens</th>
                    <th className="pb-3 font-medium text-muted-foreground">Cost</th>
                    <th className="pb-3 font-medium text-muted-foreground">Latency</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topRequests.map(
                    (
                      req: {
                        id: string;
                        model: string;
                        totalTokens: number;
                        totalCost: number;
                        latencyMs: number;
                        status: string;
                      },
                      index: number
                    ) => (
                      <tr key={req.id} className="border-b last:border-0">
                        <td className="py-3 text-muted-foreground">{index + 1}</td>
                        <td className="py-3">
                          <Badge variant="secondary">{req.model}</Badge>
                        </td>
                        <td className="py-3">{formatNumber(req.totalTokens)}</td>
                        <td className="py-3 font-medium">{formatCost(req.totalCost)}</td>
                        <td className="py-3">{req.latencyMs}ms</td>
                        <td className="py-3">
                          <Badge variant={req.status === 'success' ? 'success' : 'destructive'}>
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No request data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
