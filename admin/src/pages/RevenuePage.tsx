import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { formatCost } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  invoiceCount: number;
}

export default function RevenuePage() {
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

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(data.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Latest Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.length > 0 ? formatCost(chartData[chartData.length - 1].revenue) : '$0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.invoiceCount}</div>
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
    </div>
  );
}
