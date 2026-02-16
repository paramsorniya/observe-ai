import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, AlertTriangle, CheckCircle, Clock, ArrowDownRight, ArrowUpRight, Users } from 'lucide-react';
import api from '@/lib/axios';
import { formatNumber, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  currentPeriodEnd: string | null;
  pendingDowngrade: boolean;
  downgradeDate: string | null;
  downgradeTo: string | null;
  paymentFailedAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnalyticsData {
  tierBreakdown: Record<string, number>;
  paidStatusBreakdown: Record<string, number>;
  totalFree: number;
  totalPaid: number;
  atRiskUsers: Array<{
    id: string; email: string; name: string | null; subscriptionTier: string;
    paymentFailedAt: string | null; currentPeriodEnd: string | null;
  }>;
  pendingDowngrades: Array<{
    id: string; email: string; name: string | null; subscriptionTier: string;
    downgradeTo: string | null; downgradeDate: string | null;
  }>;
  recentEvents: Array<{
    id: string; event: string; oldTier: string | null; newTier: string | null;
    reason: string | null; metadata: any; timestamp: string; userEmail: string; userName: string | null;
  }>;
}

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle className="h-4 w-4 text-green-500" />,
  past_due: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  canceled: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'at-risk' | 'downgrades' | 'events'>('all');

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
      if (tierFilter) params.tier = tierFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/subscription-analytics');
      setAnalytics(res.data);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchAnalytics(); }, []);
  useEffect(() => { fetchUsers(1); }, [tierFilter, statusFilter]);

  const tiers = analytics?.tierBreakdown ?? {};
  const totalAll = Object.values(tiers).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setTierFilter(''); setStatusFilter(''); }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Users</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAll}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setTierFilter('FREE'); setStatusFilter(''); }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Free</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers['FREE'] ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setTierFilter('STARTER'); setStatusFilter(''); }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-500">Starter</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers['STARTER'] ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setTierFilter('PRO'); setStatusFilter(''); }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-500">Pro</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers['PRO'] ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setTierFilter('ENTERPRISE'); setStatusFilter(''); }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-500">Enterprise</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers['ENTERPRISE'] ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-green-500/50" onClick={() => { setTierFilter(''); setStatusFilter('active'); }}>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-lg font-bold">{analytics?.paidStatusBreakdown?.['active'] ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active paid subscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:border-yellow-500/50 ${(analytics?.atRiskUsers?.length ?? 0) > 0 ? 'border-yellow-500/50' : ''}`}
          onClick={() => setActiveTab('at-risk')}
        >
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-lg font-bold text-yellow-500">{analytics?.atRiskUsers?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Past due (at risk)</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:border-orange-500/50 ${(analytics?.pendingDowngrades?.length ?? 0) > 0 ? 'border-orange-500/50' : ''}`}
          onClick={() => setActiveTab('downgrades')}
        >
          <CardContent className="flex items-center gap-3 pt-6">
            <ArrowDownRight className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold text-orange-500">{analytics?.pendingDowngrades?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending downgrades</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { key: 'all', label: 'All Subscribers' },
          { key: 'at-risk', label: `At Risk (${analytics?.atRiskUsers?.length ?? 0})` },
          { key: 'downgrades', label: `Downgrades (${analytics?.pendingDowngrades?.length ?? 0})` },
          { key: 'events', label: 'Activity Log' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: All Subscribers */}
      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Tiers</option>
              <option value="FREE">Free</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
            {(tierFilter || statusFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setTierFilter(''); setStatusFilter(''); }}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Plan</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Usage</th>
                      <th className="text-left p-3 font-medium">Period Ends</th>
                      <th className="text-left p-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No subscriptions found</td></tr>
                    ) : users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <td className="p-3">
                          <p className="font-medium">{user.name || user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                            {user.subscriptionTier}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {statusIcon[user.subscriptionStatus] ?? null}
                            <span className="capitalize">{user.subscriptionStatus}</span>
                            {user.pendingDowngrade && (
                              <span className="text-xs text-yellow-500 ml-1">(↓ {user.downgradeTo})</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatNumber(user.monthlyRequestCount)} / {formatNumber(user.monthlyRequestLimit)}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {user.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : '—'}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchUsers(pagination.page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: At Risk Users */}
      {activeTab === 'at-risk' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Past Due Users — At Risk of Auto-Downgrade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!analytics?.atRiskUsers || analytics.atRiskUsers.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No at-risk users</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Current Plan</th>
                      <th className="text-left p-3 font-medium">Payment Failed</th>
                      <th className="text-left p-3 font-medium">Days Overdue</th>
                      <th className="text-left p-3 font-medium">Auto-Downgrade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.atRiskUsers.map((u) => {
                      const failedAt = u.paymentFailedAt ? new Date(u.paymentFailedAt) : null;
                      const daysOverdue = failedAt ? Math.floor((Date.now() - failedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      const daysLeft = Math.max(0, 7 - daysOverdue);
                      return (
                        <tr key={u.id} className="border-b border-border hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/users/${u.id}`)}>
                          <td className="p-3">
                            <p className="font-medium">{u.name || u.email}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                              {u.subscriptionTier}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{failedAt ? formatDate(u.paymentFailedAt!) : '—'}</td>
                          <td className="p-3">
                            <span className={`font-medium ${daysOverdue >= 5 ? 'text-destructive' : 'text-yellow-500'}`}>
                              {daysOverdue} days
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs font-medium ${daysLeft <= 2 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {daysLeft === 0 ? 'Imminent' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Pending Downgrades */}
      {activeTab === 'downgrades' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-orange-500" />
              Pending Downgrades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!analytics?.pendingDowngrades || analytics.pendingDowngrades.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending downgrades</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Current Plan</th>
                      <th className="text-left p-3 font-medium">Downgrading To</th>
                      <th className="text-left p-3 font-medium">Downgrade Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.pendingDowngrades.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/users/${u.id}`)}>
                        <td className="p-3">
                          <p className="font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                            {u.subscriptionTier}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-orange-500 font-medium">{u.downgradeTo ?? 'FREE'}</span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {u.downgradeDate ? formatDate(u.downgradeDate) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Activity Log */}
      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {(!analytics?.recentEvents || analytics.recentEvents.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No subscription events yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.recentEvents.map((e) => (
                  <div key={e.id} className="flex items-start justify-between text-sm border-b border-border pb-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {e.event === 'upgraded' && <ArrowUpRight className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                        {(e.event === 'downgraded' || e.event === 'downgrade_requested') && <ArrowDownRight className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                        {e.event === 'downgrade_canceled' && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                        {e.event === 'canceled' && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                        <span className="font-medium capitalize">{e.event.replace(/_/g, ' ')}</span>
                        {e.oldTier && e.newTier && (
                          <span className="text-muted-foreground">{e.oldTier} → {e.newTier}</span>
                        )}
                        {e.metadata?.adminAction && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{e.userName || e.userEmail}</p>
                      {e.reason && <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{formatDate(e.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
