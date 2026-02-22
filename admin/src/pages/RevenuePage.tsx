import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, FileText, Users, Search, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { formatCost, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RevenueStats {
  totalRevenue: number;
  mrr: number;
  arr: number;
  arpu: number;
  invoiceCount: number;
  compCount: number;
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
  revenueBySource: { stripe: number; admin: number };
  mrrByTier: Array<{ tier: string; count: number; mrr: number }>;
}

interface InvoiceRow {
  id: string;
  stripeInvoiceId: string;
  stripePaymentIntentId: string | null;
  amount: number;
  currency: string;
  status: string;
  source: 'stripe' | 'admin' | 'comp';
  paidAt: string | null;
  createdAt: string;
  invoiceUrl: string | null;
  invoicePdf: string | null;
  userId: string;
  userEmail: string;
  userName: string | null;
  userTier: string;
}

interface InvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TIER_COLORS: Record<string, string> = {
  STARTER: 'bg-blue-500',
  PRO: 'bg-purple-500',
  ENTERPRISE: 'bg-amber-500',
};

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Pro Plus',
  ENTERPRISE: 'Enterprise',
};

const SOURCE_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  admin: 'Admin (Charged)',
  comp: 'Complimentary',
};

const SOURCE_BADGE: Record<string, string> = {
  stripe: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  admin: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  comp: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
};

function truncateId(id: string, maxLen = 24) {
  return id.length > maxLen ? `…${id.slice(-maxLen)}` : id;
}

export default function RevenuePage() {
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Invoices
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [pagination, setPagination] = useState<InvoicePagination>({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api.get('/admin/revenue')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchInvoices = useCallback((page: number) => {
    setInvoiceLoading(true);
    const params: Record<string, any> = { page, limit: 30 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sourceFilter) params.source = sourceFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    api.get('/admin/invoices', { params })
      .then((res) => {
        setInvoices(res.data.invoices);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setInvoiceLoading(false));
  }, [debouncedSearch, sourceFilter, fromDate, toDate]);

  useEffect(() => { fetchInvoices(1); }, [fetchInvoices]);

  if (statsLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load revenue data</div>;
  }

  const chartData = stats.monthlyRevenue.map((m) => ({ ...m, label: m.month }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Revenue</h1>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(stats.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(stats.arr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual run rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(stats.arpu)}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg per paid user/mo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoiceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.compCount > 0 ? `+${stats.compCount} comp` : 'Paid invoices'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MRR by Tier + Revenue by Source */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>MRR by Tier</CardTitle></CardHeader>
          <CardContent>
            {stats.mrrByTier.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid subscribers yet</p>
            ) : (
              <div className="space-y-4">
                {stats.mrrByTier.map((t) => {
                  const pct = stats.mrr > 0 ? (t.mrr / stats.mrr) * 100 : 0;
                  return (
                    <div key={t.tier} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${TIER_COLORS[t.tier] || 'bg-gray-500'}`} />
                          <span className="font-medium">{TIER_LABELS[t.tier] ?? t.tier}</span>
                          <span className="text-muted-foreground text-xs">({t.count} users)</span>
                        </div>
                        <span className="font-medium">{formatCost(t.mrr)}/mo</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Source</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.revenueBySource).map(([source, amount]) => {
                if (amount === 0) return null;
                const pct = stats.totalRevenue > 0 ? (amount / stats.totalRevenue) * 100 : 0;
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{SOURCE_LABELS[source] || source}</span>
                      <span>
                        {formatCost(amount)}
                        <span className="text-muted-foreground ml-1">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }).filter(Boolean)}
              {stats.totalRevenue === 0 && (
                <p className="text-sm text-muted-foreground">No revenue recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart + Table */}
      <Card>
        <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No revenue data yet</p>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                    <XAxis dataKey="label" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)' }}
                      labelStyle={{ color: 'hsl(210 40% 98%)' }}
                      formatter={(value: number) => [formatCost(value), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="hsl(217.2 91.2% 59.8%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Month</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.monthlyRevenue].reverse().map((m) => (
                      <tr key={m.month} className="border-b border-border/50 hover:bg-accent/30">
                        <td className="py-2 px-3 font-mono text-xs">{m.month}</td>
                        <td className="py-2 px-3 text-right font-medium">{formatCost(m.revenue)}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* All Invoices — Paginated */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>
              Invoices
              {pagination.total > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({pagination.total} total)
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Invoice ID, payment ID, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm w-72 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {/* Source filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Sources</option>
                <option value="stripe">Stripe</option>
                <option value="admin">Admin (Charged)</option>
                <option value="comp">Complimentary</option>
              </select>
              {/* Date range */}
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  title="From date"
                />
                <span className="text-muted-foreground text-sm">→</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  title="To date"
                />
              </div>
              {(search || sourceFilter || fromDate || toDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSourceFilter(''); setFromDate(''); setToDate(''); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {invoiceLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No invoices found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Payment ID</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const paymentId = inv.source === 'stripe' && inv.stripePaymentIntentId
                      ? inv.stripePaymentIntentId
                      : inv.stripeInvoiceId;
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/users/${inv.userId}`)}
                      >
                        <td className="p-3">
                          <p className="font-medium">{inv.userName || inv.userEmail}</p>
                          <p className="text-xs text-muted-foreground">{inv.userEmail}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                            {TIER_LABELS[inv.userTier] ?? inv.userTier}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className="font-mono text-xs text-muted-foreground"
                            title={paymentId}
                          >
                            {truncateId(paymentId)}
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          {inv.amount === 0
                            ? <span className="text-muted-foreground">$0.00</span>
                            : formatCost(inv.amount)
                          }
                          <span className="text-xs text-muted-foreground ml-1">{inv.currency.toUpperCase()}</span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_BADGE[inv.source] || ''}`}>
                            {SOURCE_LABELS[inv.source] || inv.source}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(inv.paidAt || inv.createdAt)}
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {inv.invoiceUrl && (
                              <a
                                href={inv.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View
                              </a>
                            )}
                            {inv.invoicePdf && (
                              <a
                                href={inv.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                              >
                                PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
                <span className="ml-1">({pagination.total} invoices)</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchInvoices(pagination.page - 1)}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* Page number pills */}
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  const p = Math.max(1, pagination.page - 2) + i;
                  if (p > pagination.totalPages) return null;
                  return (
                    <Button
                      key={p}
                      variant={p === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => fetchInvoices(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  variant="outline" size="icon"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchInvoices(pagination.page + 1)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
