import { useState } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Minus,
  Zap, Activity, Calendar, AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCostBreakdown } from '@/hooks/useDashboardStats';
import { canAccessFeature, TIER_RETENTION_DAYS } from '@/lib/features';
import { formatCost, formatNumber, formatDate, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

/* ─── colour maps ─── */
const MODEL_COLORS = [
  'hsl(var(--primary))', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
];

const PROVIDER_COLOR: Record<string, string> = {
  openai:    '#10b981',
  anthropic: '#f97316',
  gemini:    '#3b82f6',
};

/* ─── helpers ─── */
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">vs yesterday: —</span>;
  const up = pct > 0;
  const zero = pct === 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      zero ? 'text-muted-foreground' : up ? 'text-destructive' : 'text-emerald-500'
    )}>
      {zero ? <Minus className="h-3 w-3" /> : up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {zero ? 'No change' : `${up ? '+' : ''}${pct}% vs yesterday`}
    </span>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string; value: string; sub?: React.ReactNode;
  icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && 'border-destructive/40')}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <Icon className={cn('h-4 w-4', highlight ? 'text-destructive' : 'text-muted-foreground')} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <div className="mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

/* ─── Period options ─── */
const ALL_PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function CostsPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const userTier = useAuthStore((s) => s.user?.subscriptionTier);
  const tier = (userTier ?? 'FREE') as keyof typeof TIER_RETENTION_DAYS;
  const retentionDays = TIER_RETENTION_DAYS[tier];
  const canCustomDate = canAccessFeature(userTier, 'custom_date_ranges');

  // Available periods gated by plan
  const availablePeriods = ALL_PERIODS.filter((p) =>
    p.value === 7 || (canCustomDate && p.value <= retentionDays)
  );
  const [period, setPeriod] = useState(7);

  const { data: costBreakdown, isLoading } = useCostBreakdown(currentProjectId, period);

  const { summary, costByModel = [], costByProvider = [], dailyCost = [], topRequests = [] } = costBreakdown ?? {};
  const totalCost: number = summary?.totalCost ?? 0;
  const isEmpty = !isLoading && (!costBreakdown || costBreakdown.summary?.totalRequests === 0);

  return (
    <div className="space-y-6">
      {/* ── Header + period selector — always visible ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Analytics</h1>
          <p className="text-muted-foreground">Track and analyse your AI API spending</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
          {availablePeriods.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
          {!canCustomDate && (
            <span
              title="Upgrade to Pro for 30-day history"
              className="px-3 text-xs text-muted-foreground cursor-not-allowed"
            >
              🔒 30d / 90d
            </span>
          )}
        </div>
      </div>

      {/* ── Loading / Empty state ── */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : isEmpty ? (
        <EmptyState
          icon={DollarSign}
          title="No cost data yet"
          description="Cost data will appear once you start making AI API requests through your project."
        />
      ) : (<>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={`Total Cost (${period}d)`}
          value={formatCost(totalCost)}
          icon={DollarSign}
          sub={<TrendBadge pct={summary?.costTrend ?? null} />}
        />
        <KpiCard
          label="Avg Cost / Request"
          value={formatCost(summary?.avgCostPerRequest ?? 0)}
          icon={Activity}
          sub={<span className="text-xs text-muted-foreground">{formatNumber(summary?.totalRequests ?? 0)} total requests</span>}
        />
        <KpiCard
          label="Daily Burn Rate"
          value={formatCost(summary?.dailyBurnRate ?? 0)}
          icon={Calendar}
          sub={<span className="text-xs text-muted-foreground">avg per day over {period}d</span>}
        />
        <KpiCard
          label="Projected Monthly"
          value={formatCost(summary?.projectedMonthlyCost ?? 0)}
          icon={TrendingUp}
          sub={<span className="text-xs text-muted-foreground">based on current burn rate</span>}
          highlight={(summary?.projectedMonthlyCost ?? 0) > 100}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily cost area chart — takes 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Daily Cost Trend</CardTitle>
            <CardDescription>Spend per day over the last {period} days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyCost}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => d.slice(5)} /* show MM-DD */
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(v: number, _: string, props: any) => [
                      formatCost(v),
                      `Cost (${props.payload?.count ?? ''} reqs)`,
                    ]}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#costGrad)"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                No daily data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost by Provider — 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Provider</CardTitle>
            <CardDescription>Spend split across AI providers</CardDescription>
          </CardHeader>
          <CardContent>
            {costByProvider.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={costByProvider} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="provider" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v: number) => [formatCost(v), 'Cost']} />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                      {costByProvider.map((p: any) => (
                        <Cell key={p.provider} fill={PROVIDER_COLOR[p.provider] ?? '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {costByProvider.map((p: any) => (
                    <div key={p.provider} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: PROVIDER_COLOR[p.provider] ?? '#94a3b8' }}
                        />
                        <span className="capitalize font-medium">{p.provider}</span>
                        <span className="text-muted-foreground">({formatNumber(p.count)} reqs)</span>
                      </div>
                      <span className="font-medium">{p.percentOfTotal.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No provider data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Cost by Model — full table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost by Model</CardTitle>
          <CardDescription>
            Detailed breakdown — prompt vs completion tokens, avg cost per call
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {costByModel.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Model</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Calls</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Prompt tok.</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Completion tok.</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Ratio</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Avg / call</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Total cost</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">% of spend</th>
                  </tr>
                </thead>
                <tbody>
                  {costByModel.map((m: any, i: number) => {
                    const ratio = m.promptTokens > 0
                      ? (m.completionTokens / m.promptTokens).toFixed(2)
                      : '—';
                    return (
                      <tr key={m.model} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }}
                            />
                            <span className="font-medium font-mono text-xs">{m.model}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right tabular-nums">{formatNumber(m.count)}</td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">
                          {formatNumber(m.promptTokens)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">
                          {formatNumber(m.completionTokens)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-xs">
                          <span
                            title="completion / prompt token ratio — higher means more output per input"
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs',
                              parseFloat(ratio) > 2
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {ratio}x
                          </span>
                        </td>
                        <td className="p-3 text-right tabular-nums font-medium">
                          {formatCost(m.avgCostPerRequest)}
                        </td>
                        <td className="p-3 text-right tabular-nums font-bold">
                          {formatCost(m.cost)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(m.percentOfTotal, 100)}%`,
                                  background: MODEL_COLORS[i % MODEL_COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-xs tabular-nums w-10 text-right">
                              {m.percentOfTotal.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/20">
                    <td className="p-3 font-semibold">Total</td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {formatNumber(summary?.totalRequests ?? 0)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      {formatNumber(costByModel.reduce((s: number, m: any) => s + m.promptTokens, 0))}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      {formatNumber(costByModel.reduce((s: number, m: any) => s + m.completionTokens, 0))}
                    </td>
                    <td className="p-3" />
                    <td className="p-3 text-right tabular-nums font-semibold">
                      {formatCost(summary?.avgCostPerRequest ?? 0)}
                    </td>
                    <td className="p-3 text-right tabular-nums font-bold text-primary">
                      {formatCost(totalCost)}
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No model data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top 10 Most Expensive Requests ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Most Expensive Requests</CardTitle>
          <CardDescription>Highest-cost individual calls in the last {period} days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {topRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Provider</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Model</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Prompt tok.</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Completion tok.</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Cost</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Latency</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topRequests.map((req: any, index: number) => (
                    <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground font-medium">{index + 1}</td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(req.timestamp)}
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          req.provider === 'openai'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                            : req.provider === 'anthropic'
                            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                            : req.provider === 'gemini'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {req.provider}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{req.model}</Badge>
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(req.promptTokens)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(req.completionTokens)}
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums">
                        {formatCost(req.totalCost)}
                      </td>
                      <td className="p-3 text-right tabular-nums">{req.latencyMs}ms</td>
                      <td className="p-3">
                        <Badge variant={req.status === 'success' ? 'success' : 'destructive'}>
                          {req.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No requests found for this period
            </div>
          )}
        </CardContent>
      </Card>
      </>)}
    </div>
  );
}
