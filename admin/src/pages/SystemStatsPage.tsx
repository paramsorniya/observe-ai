import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Server, Cpu } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '@/lib/axios';
import { formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SystemData {
  totalRequests: number;
  requestsLast24h: number;
  errorRate: number;
  modelDistribution: Array<{ model: string; count: number }>;
}

const COLORS = [
  'hsl(217 91% 60%)',
  'hsl(142 71% 45%)',
  'hsl(47 96% 53%)',
  'hsl(0 84% 60%)',
  'hsl(280 68% 60%)',
  'hsl(190 90% 50%)',
  'hsl(25 95% 53%)',
  'hsl(330 80% 60%)',
];

export default function SystemStatsPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/system-stats')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load system stats</div>;
  }

  const totalModelCalls = data.modelDistribution.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">System Stats</h1>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalRequests)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.requestsLast24h)}</div>
            <p className="text-xs text-muted-foreground">Requests processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.errorRate > 5 ? 'text-destructive' : 'text-green-500'}`}>
              {data.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Models Used</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.modelDistribution.length}</div>
            <p className="text-xs text-muted-foreground">Distinct models</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Distribution Chart */}
        {data.modelDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Model Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.modelDistribution}
                      dataKey="count"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ model, count }) => `${model} (${count})`}
                      labelLine={false}
                    >
                      {data.modelDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)' }}
                      formatter={(value: number, name: string) => [formatNumber(value), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.modelDistribution.map((m, i) => {
                const pct = totalModelCalls > 0 ? (m.count / totalModelCalls) * 100 : 0;
                return (
                  <div key={m.model} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-mono">{m.model}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatNumber(m.count)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
