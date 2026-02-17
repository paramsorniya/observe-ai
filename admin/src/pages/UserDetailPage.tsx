import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Ban, CheckCircle, Trash2, Tag, UserCheck, Zap, Clock,
  TrendingUp, AlertTriangle, BarChart3,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatDate, formatCost, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ─── Types ─── */

interface TimelineEvent {
  date: string;
  event: string;
  detail?: string;
}

interface MonthlyApiCall {
  month: string;
  count: number;
}

interface FeatureUsageItem {
  provider: string;
  model: string;
  count: number;
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  userStatus: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  apiCallsThisMonth: number;
  totalApiCallsLifetime: number;
  freeLimitHitCount: number;
  firstApiCallAt: string | null;
  lastApiCallAt: string | null;
  lastActiveAt: string;
  planStartedAt: string;
  integrationCompletedAt: string | null;
  referralSource: string | null;
  projectLimit: number;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  pendingDowngrade: boolean;
  downgradeDate: string | null;
  downgradeTo: string | null;
  paymentFailedAt: string | null;
  createdAt: string;
  projects: Array<{ id: string; name: string; isActive: boolean; _count: { requests: number } }>;
  subscriptionHistory: Array<{ id: string; event: string; oldTier: string | null; newTier: string | null; reason: string | null; metadata: any; timestamp: string }>;
  invoices: Array<{ id: string; stripeInvoiceId: string; amount: number; currency: string; status: string; paidAt: string | null; createdAt: string }>;
  tags: string[];
  monthlyApiCalls: MonthlyApiCall[];
  featureUsage: FeatureUsageItem[];
  timeline: TimelineEvent[];
  daysSinceLastActivity: number | null;
}

/* ─── Status badge ─── */

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  dormant: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  ghost: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  integrated: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  churned: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400' },
};

/* ─── Timeline event icons and labels ─── */

const TIMELINE_CONFIG: Record<string, { icon: typeof Zap; color: string; label: string }> = {
  registered: { icon: UserCheck, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40', label: 'Registered' },
  sdk_integrated: { icon: Zap, color: 'text-green-500 bg-green-100 dark:bg-green-900/40', label: 'SDK Integrated' },
  first_api_call: { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40', label: 'First API Call' },
  upgraded: { icon: TrendingUp, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/40', label: 'Upgraded' },
  downgraded: { icon: AlertTriangle, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/40', label: 'Downgraded' },
  updated: { icon: Clock, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', label: 'Plan Updated' },
};

/* ─── Simple bar chart component (no external dep) ─── */

function MiniBarChart({ data }: { data: MonthlyApiCall[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No API call data yet</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center flex-1 min-w-0 gap-1">
          <span className="text-[9px] text-muted-foreground tabular-nums">{formatNumber(d.count)}</span>
          <div
            className="w-full rounded-t bg-primary/70 min-h-[2px] transition-all"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="text-[8px] text-muted-foreground truncate w-full text-center">
            {d.month.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierOverride, setTierOverride] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const fetchUser = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data.user);
      setTierOverride(res.data.user.subscriptionTier);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleBan = async () => {
    if (!user || !confirm('Ban this user?')) return;
    await api.post(`/admin/users/${user.id}/ban`);
    fetchUser();
  };

  const handleUnban = async () => {
    if (!user) return;
    await api.post(`/admin/users/${user.id}/unban`);
    fetchUser();
  };

  const handleDelete = async () => {
    if (!user || !confirm('Permanently delete this user?')) return;
    await api.delete(`/admin/users/${user.id}`);
    navigate('/users');
  };

  const handleOverrideTier = async () => {
    if (!user) return;
    await api.post(`/admin/users/${user.id}/subscription`, {
      tier: tierOverride,
      reason: overrideReason || undefined,
    });
    setOverrideReason('');
    await fetchUser();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">User not found</div>;
  }

  const statusStyle = STATUS_STYLES[user.userStatus] || STATUS_STYLES.ghost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{user.name || user.email}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              {user.userStatus}
            </span>
          </div>
          <p className="text-muted-foreground">{user.email}</p>
          {user.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {user.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  <Tag className="h-2.5 w-2.5 mr-0.5" />{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Key Metrics Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Lifetime Calls', value: formatNumber(user.totalApiCallsLifetime) },
          { label: 'This Month', value: formatNumber(user.apiCallsThisMonth) },
          { label: 'Limit Hits', value: String(user.freeLimitHitCount), highlight: user.freeLimitHitCount > 0 },
          { label: 'Days Inactive', value: user.daysSinceLastActivity !== null ? `${user.daysSinceLastActivity}d` : '—', highlight: (user.daysSinceLastActivity ?? 0) > 14 },
          { label: 'Projects', value: `${user.projects.length} / ${user.projectLimit}` },
          { label: 'Plan Since', value: new Date(user.planStartedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground uppercase font-medium">{m.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${m.highlight ? 'text-orange-500' : ''}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Timeline ─── */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> User Journey Timeline</CardTitle></CardHeader>
        <CardContent>
          {user.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />

              <div className="space-y-4">
                {user.timeline.map((evt, i) => {
                  const config = TIMELINE_CONFIG[evt.event] || TIMELINE_CONFIG.updated;
                  const IconComp = config.icon;
                  return (
                    <div key={i} className="relative flex items-start gap-4 pl-1">
                      <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full ${config.color}`}>
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{config.label}</span>
                          {evt.detail && (
                            <span className="text-xs text-muted-foreground">{evt.detail}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(evt.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ─── Monthly API Calls Chart ─── */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly API Calls</CardTitle></CardHeader>
          <CardContent>
            <MiniBarChart data={user.monthlyApiCalls} />
          </CardContent>
        </Card>

        {/* ─── Feature Usage (Models/Providers) ─── */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" /> Models Used</CardTitle></CardHeader>
          <CardContent>
            {user.featureUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No usage data</p>
            ) : (
              <div className="space-y-2">
                {user.featureUsage.map((f, i) => {
                  const maxCount = user.featureUsage[0]?.count || 1;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{f.model}</span>
                        <span className="text-muted-foreground text-xs">{f.provider} · {formatNumber(f.count)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(f.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ─── Account Info ─── */}
        <Card>
          <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{user.subscriptionTier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subscription Status</span>
              <span className={
                user.subscriptionStatus === 'past_due' ? 'text-yellow-500 font-medium'
                : user.subscriptionStatus === 'canceled' ? 'text-red-500 font-medium'
                : 'text-green-500 font-medium'
              }>{user.subscriptionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span>{formatNumber(user.monthlyRequestCount)} / {formatNumber(user.monthlyRequestLimit)}</span>
            </div>
            {user.referralSource && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referral Source</span>
                <span className="font-mono text-xs">{user.referralSource}</span>
              </div>
            )}
            {user.integrationCompletedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SDK Integrated</span>
                <span>{formatDate(user.integrationCompletedAt)}</span>
              </div>
            )}
            {user.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period Ends</span>
                <span>{formatDate(user.currentPeriodEnd)}</span>
              </div>
            )}
            {user.pendingDowngrade && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Downgrade</span>
                <span className="text-yellow-500">
                  → {user.downgradeTo} on {user.downgradeDate ? formatDate(user.downgradeDate) : '—'}
                </span>
              </div>
            )}
            {user.paymentFailedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Failed</span>
                <span className="text-destructive">{formatDate(user.paymentFailedAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login</span>
              <span>{formatDate(user.lastActiveAt)}</span>
            </div>
            {user.stripeCustomerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe Customer</span>
                <span className="font-mono text-xs">{user.stripeCustomerId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Actions ─── */}
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
              <Input
                placeholder="Reason (e.g., Comp upgrade, refund, trial extension)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
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

      {/* ─── Projects ─── */}
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

      {/* ─── Subscription History ─── */}
      <Card>
        <CardHeader><CardTitle>Subscription History ({user.subscriptionHistory.length})</CardTitle></CardHeader>
        <CardContent>
          {user.subscriptionHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription changes yet</p>
          ) : (
            <div className="space-y-2">
              {user.subscriptionHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <span className="font-medium capitalize">{h.event.replace(/_/g, ' ')}</span>
                    {h.oldTier && h.newTier && (
                      <span className="text-muted-foreground"> {h.oldTier} → {h.newTier}</span>
                    )}
                    {h.metadata?.adminAction && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">Admin</span>
                    )}
                    {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{formatDate(h.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Invoices ─── */}
      <Card>
        <CardHeader><CardTitle>Invoices ({user.invoices.length})</CardTitle></CardHeader>
        <CardContent>
          {user.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {user.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{formatCost(Number(inv.amount))} {inv.currency.toUpperCase()}</span>
                    <span className={`ml-2 text-xs ${inv.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {inv.status}
                    </span>
                    {inv.stripeInvoiceId.startsWith('admin_override') && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">Admin</span>
                    )}
                    {inv.stripeInvoiceId.startsWith('mock_inv') && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">Mock</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{inv.paidAt ? formatDate(inv.paidAt) : formatDate(inv.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
