import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Wrench, AlertTriangle, Activity, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowUpDown,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useToolStats } from '@/hooks/useDashboardStats';
import { canAccessFeature, TIER_RETENTION_DAYS } from '@/lib/features';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeatureLockedScreen } from '@/components/shared/FeatureLockedScreen';

const BAR_COLORS = [
  'hsl(var(--primary))', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
];

const ALL_PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

type SortKey = 'count' | 'avgLatency';

interface ToolStat {
  name: string;
  count: number;
  avgLatency: number;
}

interface FailedCall {
  id: string;
  toolName: string;
  errorMessage: string | null;
  timestamp: string;
  latencyMs: number | null;
}

function FailedCallCard({ call }: { call: FailedCall }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border overflow-hidden">
      <div
        className="flex items-start justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="destructive" className="shrink-0">Error</Badge>
          <span className="font-mono text-sm font-medium truncate">{call.toolName}</span>
          {call.latencyMs != null && (
            <span className="text-xs text-muted-foreground shrink-0">{call.latencyMs}ms</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(call.timestamp)}
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && call.errorMessage && (
        <div className="border-t px-3 pb-3 pt-2 bg-destructive/5">
          <p className="text-xs text-muted-foreground mb-1">Error message</p>
          <pre className="text-xs bg-background border border-destructive/20 rounded p-2 whitespace-pre-wrap break-all">
            {call.errorMessage}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ToolTrackingPage() {
  const { hasAccess, minimumPlan } = useFeatureAccess('tool_tracking');
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const userTier = useAuthStore((s) => s.user?.subscriptionTier);
  const tier = (userTier ?? 'FREE') as keyof typeof TIER_RETENTION_DAYS;
  const retentionDays = TIER_RETENTION_DAYS[tier];
  const canCustomDate = canAccessFeature(userTier, 'custom_date_ranges');

  // Period selector — same gating as CostsPage / ErrorsPage
  const availablePeriods = ALL_PERIODS.filter(
    (p) => p.value === 7 || (canCustomDate && p.value <= retentionDays)
  );
  const [period, setPeriod] = useState(7);
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const [failedPage, setFailedPage] = useState(1);

  const { data, isLoading, error } = useToolStats(currentProjectId, {
    period,
    page: failedPage,
    limit: 20,
  });

  if (!hasAccess) {
    return (
      <FeatureLockedScreen
        feature="Tool Tracking"
        minimumPlan={minimumPlan ?? 'STARTER'}
      />
    );
  }

  const periodLabel = ALL_PERIODS.find((p) => p.value === period)?.label ?? `${period}d`;

  const byTool: ToolStat[] = data?.byTool ?? [];
  const recentFailed: FailedCall[] = data?.recentFailed ?? [];
  const pagination = data?.pagination;
  const totalCalls: number = data?.totalCalls ?? 0;
  const failedCalls: number = data?.failedCalls ?? 0;
  const successRate: number = data?.successRate ?? 100;

  // Sort tool breakdown client-side
  const sortedTools = [...byTool].sort((a, b) =>
    sortKey === 'count' ? b.count - a.count : b.avgLatency - a.avgLatency
  );

  // Chart data — top 10 by count
  const chartData = [...byTool]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((t) => ({ name: t.name, calls: t.count }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tool Tracking</h1>
          <p className="text-muted-foreground">
            Monitor which tools and functions your AI is calling
          </p>
        </div>

        {/* Period selector — same pattern as CostsPage */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
          {availablePeriods.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => { setPeriod(p.value); setFailedPage(1); }}
            >
              {p.label}
            </Button>
          ))}
          {!canCustomDate && (
            <span
              title="Upgrade to Pro for 30-day history"
              className="px-3 text-xs text-muted-foreground cursor-not-allowed select-none"
            >
              🔒 30d / 90d
            </span>
          )}
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load tool stats"
          description="Something went wrong. Please try refreshing the page."
        />
      ) : !data || totalCalls === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tool calls recorded"
          description="Tool call data will appear here once your AI starts making function calls."
        />
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">Total Calls</p>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatNumber(totalCalls)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">in the last {periodLabel}</p>
              </CardContent>
            </Card>

            <Card className={cn(successRate < 90 && 'border-destructive/40')}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">Success Rate</p>
                  <CheckCircle className={cn(
                    'h-4 w-4',
                    successRate >= 90 ? 'text-green-500' : 'text-destructive'
                  )} />
                </div>
                <p className={cn(
                  'text-2xl font-bold',
                  successRate < 90 && 'text-destructive'
                )}>
                  {successRate.toFixed(1)}%
                </p>
                <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      successRate >= 90 ? 'bg-green-500' : 'bg-destructive'
                    )}
                    style={{ width: `${Math.min(successRate, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">Unique Tools</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{byTool.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {failedCalls > 0
                    ? `${formatNumber(failedCalls)} failed calls`
                    : 'No failures in this period'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Tool Usage Chart (top 10) ── */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tool Call Volume</CardTitle>
                <CardDescription>Top {Math.min(chartData.length, 10)} tools by call count — last {periodLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={120}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + '…' : v}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatNumber(v), 'Calls']}
                      cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Bar dataKey="calls" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Tool Breakdown Table ── */}
          {sortedTools.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg">Tool Breakdown</CardTitle>
                    <CardDescription>All tools with call count and avg latency</CardDescription>
                  </div>
                  {/* Sort toggle */}
                  <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
                    <Button
                      size="sm"
                      variant={sortKey === 'count' ? 'default' : 'ghost'}
                      className="h-7 px-3 text-xs"
                      onClick={() => setSortKey('count')}
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      By Calls
                    </Button>
                    <Button
                      size="sm"
                      variant={sortKey === 'avgLatency' ? 'default' : 'ghost'}
                      className="h-7 px-3 text-xs"
                      onClick={() => setSortKey('avgLatency')}
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      By Latency
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground">Tool Name</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Calls</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Avg Latency</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTools.map((tool, i) => {
                        const pct = totalCalls > 0 ? (tool.count / totalCalls) * 100 : 0;
                        return (
                          <tr key={tool.name} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                                />
                                <span className="font-mono font-medium text-xs">{tool.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right tabular-nums font-medium">
                              {formatNumber(tool.count)}
                            </td>
                            <td className="p-3 text-right tabular-nums text-muted-foreground">
                              {tool.avgLatency}ms
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(pct, 100)}%`,
                                      background: BAR_COLORS[i % BAR_COLORS.length],
                                    }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Recent Failed Calls ── */}
          {(failedCalls > 0 || recentFailed.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Failed Tool Calls
                </CardTitle>
                <CardDescription>
                  {pagination
                    ? `${formatNumber(pagination.total)} failed calls in the last ${periodLabel} — showing page ${pagination.page} of ${pagination.totalPages}`
                    : `Failed calls in the last ${periodLabel}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentFailed.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No failed calls found.
                  </p>
                ) : (
                  <>
                    {recentFailed.map((call) => (
                      <FailedCallCard key={call.id} call={call} />
                    ))}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-3 border-t mt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() => setFailedPage((p) => p - 1)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setFailedPage((p) => p + 1)}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
