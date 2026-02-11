import { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';
import { formatNumber, formatCost, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DashboardData {
  totalUsers: number;
  activeSubscriptions: number;
  totalRequests: number;
  mrr: number;
  tierBreakdown: Array<{ tier: string; count: number }>;
  recentUsers: Array<{ id: string; email: string; name: string | null; subscriptionTier: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load dashboard</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalUsers)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(data.mrr)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalRequests)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.tierBreakdown.map((t) => {
                const pct = data.totalUsers > 0 ? (t.count / data.totalUsers) * 100 : 0;
                return (
                  <div key={t.tier} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.tier}</span>
                      <span className="text-muted-foreground">{t.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sign-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {u.subscriptionTier}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
