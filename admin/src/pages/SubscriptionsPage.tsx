import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
  pendingDowngrade: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TIERS = ['STARTER', 'PRO', 'ENTERPRISE'] as const;

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
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
      if (tierFilter) params.tier = tierFilter;
      if (statusFilter) params.status = statusFilter;
      // Only show paid users by default (exclude FREE unless specifically filtered)
      if (!tierFilter) {
        // Fetch all paid tiers - the backend doesn't support multi-tier filter, so we fetch without filter
        // and we'll just show everything
      }
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      const breakdown: Record<string, number> = {};
      for (const t of res.data.tierBreakdown) {
        breakdown[t.tier] = t.count;
      }
      setCounts(breakdown);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [tierFilter, statusFilter]);

  const paidCount = (counts.STARTER ?? 0) + (counts.PRO ?? 0) + (counts.ENTERPRISE ?? 0);
  const pastDueCount = users.filter((u) => u.subscriptionStatus === 'past_due').length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {TIERS.map((tier) => (
          <Card key={tier} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setTierFilter(tier)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{tier}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts[tier] ?? 0}</div>
              <p className="text-xs text-muted-foreground">active subscribers</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}</div>
            <p className="text-xs text-muted-foreground">paying customers</p>
          </CardContent>
        </Card>
      </div>

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
                  <th className="text-left p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No subscriptions found</td></tr>
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
                          <span className="text-xs text-yellow-500 ml-1">(downgrade pending)</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatNumber(user.monthlyRequestCount)} / {formatNumber(user.monthlyRequestLimit)}
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
    </div>
  );
}
