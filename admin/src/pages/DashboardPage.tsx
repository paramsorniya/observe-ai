import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, Activity, TrendingUp, AlertTriangle, ArrowDownRight, ArrowUpRight, CreditCard } from 'lucide-react';
import api from '@/lib/axios';
import { formatNumber, formatCost, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DashboardData {
  totalUsers: number;
  freeUsers: number;
  paidUsers: number;
  mrr: number;
  arr: number;
  arpu: number;
  conversionRate: number;
  totalRequests: number;
  pastDueUsers: number;
  pendingDowngradeCount: number;
  statusBreakdown: Record<string, number>;
  tierBreakdown: Array<{ tier: string; count: number }>;
  recentUsers: Array<{ id: string; email: string; name: string | null; subscriptionTier: string; createdAt: string }>;
  recentEvents: Array<{
    id: string; event: string; oldTier: string | null; newTier: string | null;
    reason: string | null; metadata: any; timestamp: string; userEmail: string; userName: string | null;
  }>;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
}

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-gray-500',
  STARTER: 'bg-blue-500',
  PRO: 'bg-purple-500',
  ENTERPRISE: 'bg-amber-500',
};

export default function DashboardPage() {
  const navigate = useNavigate();
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

  const growthPct = data.newUsersLastMonth > 0
    ? ((data.newUsersThisMonth - data.newUsersLastMonth) / data.newUsersLastMonth * 100)
    : data.newUsersThisMonth > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      {/* Top-level KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalUsers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.newUsersThisMonth} this month
              {growthPct !== 0 && (
                <span className={growthPct > 0 ? 'text-green-500 ml-1' : 'text-destructive ml-1'}>
                  {growthPct > 0 ? '+' : ''}{growthPct.toFixed(0)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(data.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ARR: {formatCost(data.arr)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.paidUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.conversionRate}% conversion · ARPU {formatCost(data.arpu)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalRequests)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts row */}
      {(data.pastDueUsers > 0 || data.pendingDowngradeCount > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.pastDueUsers > 0 && (
            <Card className="border-yellow-500/50 cursor-pointer hover:border-yellow-500" onClick={() => navigate('/subscriptions')}>
              <CardContent className="flex items-center gap-3 pt-6">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-medium text-yellow-500">{data.pastDueUsers} user{data.pastDueUsers !== 1 ? 's' : ''} with past due payments</p>
                  <p className="text-xs text-muted-foreground">At risk of auto-downgrade after 7 days</p>
                </div>
              </CardContent>
            </Card>
          )}
          {data.pendingDowngradeCount > 0 && (
            <Card className="border-orange-500/50 cursor-pointer hover:border-orange-500" onClick={() => navigate('/subscriptions')}>
              <CardContent className="flex items-center gap-3 pt-6">
                <ArrowDownRight className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="font-medium text-orange-500">{data.pendingDowngradeCount} pending downgrade{data.pendingDowngradeCount !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">Scheduled downgrades awaiting execution</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${TIER_COLORS[t.tier] || 'bg-gray-500'}`} />
                        <span className="font-medium">{t.tier}</span>
                      </div>
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

        {/* Recent Subscription Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscription Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscription events yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.recentEvents.map((e) => (
                  <div key={e.id} className="flex items-start justify-between text-sm border-b border-border pb-2 last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {(e.event === 'upgraded') && <ArrowUpRight className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                        {(e.event === 'downgraded' || e.event === 'downgrade_requested') && <ArrowDownRight className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                        {(e.event === 'canceled') && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                        <span className="font-medium capitalize">{e.event.replace(/_/g, ' ')}</span>
                        {e.metadata?.adminAction && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{e.userName || e.userEmail}</p>
                      {e.oldTier && e.newTier && (
                        <p className="text-xs text-muted-foreground">{e.oldTier} → {e.newTier}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatDate(e.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sign-ups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sign-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.recentUsers.map((u) => (
              <div
                key={u.id}
                className="rounded-md border p-3 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/users/${u.id}`)}
              >
                <p className="font-medium text-sm truncate">{u.name || u.email}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                    {u.subscriptionTier}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
