import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, CheckCircle, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { formatDate, formatCost, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  projectLimit: number;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  lastActiveAt: string;
  projects: Array<{ id: string; name: string; isActive: boolean; _count: { requests: number } }>;
  subscriptionHistory: Array<{ id: string; event: string; oldTier: string | null; newTier: string | null; reason: string | null; timestamp: string }>;
  invoices: Array<{ id: string; amount: number; currency: string; status: string; paidAt: string | null; createdAt: string }>;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierOverride, setTierOverride] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/users/${id}`)
      .then((res) => { setUser(res.data.user); setTierOverride(res.data.user.subscriptionTier); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleBan = async () => {
    if (!user || !confirm('Ban this user?')) return;
    await api.post(`/admin/users/${user.id}/ban`);
    setUser({ ...user, isBanned: true, bannedAt: new Date().toISOString() });
  };

  const handleUnban = async () => {
    if (!user) return;
    await api.post(`/admin/users/${user.id}/unban`);
    setUser({ ...user, isBanned: false, bannedAt: null, bannedReason: null });
  };

  const handleDelete = async () => {
    if (!user || !confirm('Permanently delete this user?')) return;
    await api.delete(`/admin/users/${user.id}`);
    navigate('/users');
  };

  const handleOverrideTier = async () => {
    if (!user) return;
    await api.post(`/admin/users/${user.id}/subscription`, { tier: tierOverride });
    setUser({ ...user, subscriptionTier: tierOverride });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Info */}
        <Card>
          <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{user.subscriptionTier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={user.isBanned ? 'text-destructive font-medium' : 'text-green-500 font-medium'}>
                {user.isBanned ? 'Banned' : user.subscriptionStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span>{formatNumber(user.monthlyRequestCount)} / {formatNumber(user.monthlyRequestLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projects</span>
              <span>{user.projects.length} / {user.projectLimit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Active</span>
              <span>{formatDate(user.lastActiveAt)}</span>
            </div>
            {user.stripeCustomerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe ID</span>
                <span className="font-mono text-xs">{user.stripeCustomerId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Override Tier */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Override Subscription</label>
              <div className="flex items-center gap-2">
                <select
                  value={tierOverride}
                  onChange={(e) => setTierOverride(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm flex-1"
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
                <Button size="sm" onClick={handleOverrideTier} disabled={tierOverride === user.subscriptionTier}>
                  Apply
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              {user.isBanned ? (
                <Button variant="outline" className="w-full" onClick={handleUnban}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Unban User
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={handleBan}>
                  <Ban className="h-4 w-4 mr-2 text-yellow-500" />
                  Ban User
                </Button>
              )}
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader><CardTitle>Projects ({user.projects.length})</CardTitle></CardHeader>
        <CardContent>
          {user.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects</p>
          ) : (
            <div className="space-y-2">
              {user.projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {!p.isActive && (
                      <span className="text-xs text-muted-foreground">(Inactive)</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">{formatNumber(p._count.requests)} requests</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription History */}
      {user.subscriptionHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Subscription History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.subscriptionHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <span className="font-medium capitalize">{h.event}</span>
                    {h.oldTier && h.newTier && (
                      <span className="text-muted-foreground"> {h.oldTier} → {h.newTier}</span>
                    )}
                    {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(h.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {user.invoices.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{formatCost(Number(inv.amount))} {inv.currency.toUpperCase()}</span>
                    <span className={`ml-2 text-xs ${inv.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
