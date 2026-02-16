import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, FileText, Users, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { formatCost, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RevenueData {
  totalRevenue: number;
  mrr: number;
  arr: number;
  arpu: number;
  invoiceCount: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueBySource: { stripe: number; admin: number; mock: number };
  mrrByTier: Array<{ tier: string; count: number; mrr: number }>;
  recentInvoices: Array<{
    id: string; amount: number; currency: string; status: string; source: string;
    paidAt: string | null; createdAt: string; userEmail: string; userName: string | null; userTier: string;
  }>;
}

const TIER_COLORS: Record<string, string> = {
  STARTER: 'bg-blue-500',
  PRO: 'bg-purple-500',
  ENTERPRISE: 'bg-amber-500',
};

const SOURCE_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  admin: 'Admin Override',
  mock: 'Mock (Staging)',
};

export default function RevenuePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load revenue data</div>;
  }

  const chartData = data.monthlyRevenue.map((m) => ({
    ...m,
    label: m.month,
  }));

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
            <div className="text-2xl font-bold">{formatCost(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(data.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(data.arr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual run rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(data.arpu)}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg per paid user/mo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.invoiceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* MRR by Tier + Revenue by Source */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MRR by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {data.mrrByTier.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid subscribers yet</p>
            ) : (
              <div className="space-y-4">
                {data.mrrByTier.map((t) => {
                  const pct = data.mrr > 0 ? (t.mrr / data.mrr) * 100 : 0;
                  return (
                    <div key={t.tier} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${TIER_COLORS[t.tier] || 'bg-gray-500'}`} />
                          <span className="font-medium">{t.tier}</span>
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
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.revenueBySource).map(([source, amount]) => {
                if (amount === 0) return null;
                const pct = data.totalRevenue > 0 ? (amount / data.totalRevenue) * 100 : 0;
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
              {data.totalRevenue === 0 && (
                <p className="text-sm text-muted-foreground">No revenue recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border">
                      <td className="p-3">
                        <p className="font-medium">{inv.userName || inv.userEmail}</p>
                        <p className="text-xs text-muted-foreground">{inv.userEmail}</p>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {inv.userTier}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{formatCost(inv.amount)} {inv.currency.toUpperCase()}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.source === 'stripe' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : inv.source === 'admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          {SOURCE_LABELS[inv.source] || inv.source}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{formatDate(inv.paidAt || inv.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
