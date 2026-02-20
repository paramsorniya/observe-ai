import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, AlertCircle, Search, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Copy, Check, Activity, TrendingDown,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useErrorStats } from '@/hooks/useDashboardStats';
import { canAccessFeature, TIER_RETENTION_DAYS } from '@/lib/features';
import { formatNumber, formatDate, formatCost, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const PROVIDER_BADGE: Record<string, string> = {
  openai:    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  anthropic: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  gemini:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
};

const ERROR_TYPE_COLOR: Record<string, string> = {
  rate_limit:       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  timeout:          'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  invalid_response: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  api_error:        'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
      title="Copy error message"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

type ErrorEntry = {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  errorType: string | null;
  errorMessage: string | null;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
};

function ErrorCard({ error }: { error: ErrorEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-destructive/5 border-destructive/20 overflow-hidden">
      {/* Header row — always visible */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-destructive/10 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {error.errorType && (
              <Badge
                className={cn(
                  'text-xs',
                  ERROR_TYPE_COLOR[error.errorType] ?? 'bg-destructive/20 text-destructive'
                )}
              >
                {error.errorType}
              </Badge>
            )}
            {error.provider && (
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                PROVIDER_BADGE[error.provider] ?? 'bg-muted text-muted-foreground'
              )}>
                {error.provider}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">{error.model}</Badge>
            <span className="text-xs text-muted-foreground">{error.latencyMs}ms</span>
          </div>
          <p className="text-sm text-destructive/80 line-clamp-1">
            {error.errorMessage ?? 'No error message'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(error.timestamp)}
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-destructive/20 p-4 space-y-3 bg-background/50">
          {/* Token + cost row */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Prompt tokens</p>
              <p className="font-medium tabular-nums">{formatNumber(error.promptTokens)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Completion tokens</p>
              <p className="font-medium tabular-nums">{formatNumber(error.completionTokens)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Cost incurred</p>
              <p className="font-medium tabular-nums">{formatCost(error.totalCost)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Latency</p>
              <p className="font-medium tabular-nums">{error.latencyMs}ms</p>
            </div>
          </div>

          {/* Full error message */}
          {error.errorMessage && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Error message</p>
                <CopyButton text={error.errorMessage} />
              </div>
              <pre className="text-xs bg-destructive/10 border border-destructive/20 rounded p-3 whitespace-pre-wrap break-all">
                {error.errorMessage}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ALL_PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function ErrorsPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const userTier = useAuthStore((s) => s.user?.subscriptionTier);
  const tier = (userTier ?? 'FREE') as keyof typeof TIER_RETENTION_DAYS;
  const retentionDays = TIER_RETENTION_DAYS[tier];
  const canCustomDate = canAccessFeature(userTier, 'custom_date_ranges');

  // Period selector — exactly same gating as CostsPage
  // FREE: 7d only  |  STARTER: 7d + 30d  |  PRO+: 7d + 30d + 90d
  const availablePeriods = ALL_PERIODS.filter(
    (p) => p.value === 7 || (canCustomDate && p.value <= retentionDays)
  );
  const [period, setPeriod] = useState(7);

  // Filters
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const hasActiveFilters = !!(search || modelFilter || errorTypeFilter);
  const activeFilterCount = [search, modelFilter, errorTypeFilter].filter(Boolean).length;

  function clearAll() {
    setSearch('');
    setModelFilter('');
    setErrorTypeFilter('');
    setPage(1);
  }

  function resetPage() { setPage(1); }

  const { data: errorStats, isLoading } = useErrorStats(currentProjectId, {
    period,
    model: modelFilter || undefined,
    errorType: errorTypeFilter || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const errorRate = errorStats?.errorRate ?? 0;
  const totalErrors = errorStats?.totalErrors ?? 0;
  const totalRequests = errorStats?.totalRequests ?? 0;
  const filteredErrors = errorStats?.filteredErrors ?? 0;
  const errorsByType: { type: string; count: number; percentage: number }[] = errorStats?.errorsByType ?? [];
  const recentErrors: ErrorEntry[] = errorStats?.recentErrors ?? [];
  const pagination = errorStats?.pagination;
  const dailyTrend: { date: string; count: number }[] = errorStats?.dailyTrend ?? [];

  const periodLabel = ALL_PERIODS.find((p) => p.value === period)?.label ?? `${period} days`;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Monitoring</h1>
        <p className="text-muted-foreground">
          Track and diagnose errors in your AI API calls
        </p>
      </div>

      {/* ── Period Selector + Filters ── */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Row 1: period selector */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
              {availablePeriods.map((p) => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={period === p.value ? 'default' : 'ghost'}
                  className="h-7 px-3 text-xs"
                  onClick={() => { setPeriod(p.value); resetPage(); }}
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

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearAll}>
                <X className="h-3.5 w-3.5 mr-1" />
                Clear filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            )}
          </div>

          {/* Row 2: search + model + error type */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search error messages…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Filter by model"
              value={modelFilter}
              onChange={(e) => { setModelFilter(e.target.value); resetPage(); }}
              className="sm:w-44"
            />
            <select
              value={errorTypeFilter}
              onChange={(e) => { setErrorTypeFilter(e.target.value); resetPage(); }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
            >
              <option value="">All Error Types</option>
              {errorsByType.map((e) => (
                <option key={e.type} value={e.type}>{e.type} ({e.count})</option>
              ))}
            </select>
          </div>

          {/* FREE tier notice */}
          {tier === 'FREE' && (
            <p className="text-xs text-muted-foreground">
              Your plan stores the last <strong>7 days</strong> of error history.{' '}
              <a href="/dashboard/upgrade" className="text-primary underline hover:no-underline">
                Upgrade to Pro
              </a>{' '}
              for 30-day history.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : !errorStats ? (
        <EmptyState
          icon={AlertTriangle}
          title="No error data available"
          description="Error data will appear here once your project starts processing requests."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className={cn(errorRate > 0.1 && 'border-destructive/40')}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">Error Rate</p>
                  <AlertTriangle className={cn('h-4 w-4', errorRate > 0.1 ? 'text-destructive' : 'text-muted-foreground')} />
                </div>
                <p className={cn('text-2xl font-bold', errorRate > 0.1 && 'text-destructive')}>
                  {(errorRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  of all requests in {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">Total Errors</p>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatNumber(totalErrors)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  in {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">Total Requests</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatNumber(totalRequests)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  in {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {hasActiveFilters ? 'Filtered Errors' : 'Error Types'}
                  </p>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {hasActiveFilters ? formatNumber(filteredErrors) : formatNumber(errorsByType.length)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasActiveFilters ? 'matching your filters' : 'distinct error types'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Daily Error Trend ── */}
          {dailyTrend.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Trend</CardTitle>
                <CardDescription>
                  Daily error count over the last {periodLabel}
                  {hasActiveFilters && ' (filtered)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(v: number) => [v, 'Errors']}
                      labelFormatter={(l: string) => `Date: ${l}`}
                    />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Errors by Type ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Errors by Type</CardTitle>
              <CardDescription>Breakdown of error categories in {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {errorsByType.length > 0 ? (
                <div className="space-y-3">
                  {errorsByType.map((entry) => (
                    <div key={entry.type} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <button
                            className="text-sm font-medium truncate hover:text-primary transition-colors"
                            onClick={() => {
                              setErrorTypeFilter(errorTypeFilter === entry.type ? '' : entry.type);
                              resetPage();
                            }}
                            title={`Filter by ${entry.type}`}
                          >
                            {entry.type}
                            {errorTypeFilter === entry.type && (
                              <span className="ml-1 text-xs text-primary">(active)</span>
                            )}
                          </button>
                          <span className="text-sm text-muted-foreground ml-2 tabular-nums shrink-0">
                            {formatNumber(entry.count)} ({(entry.percentage * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-destructive rounded-full transition-all"
                            style={{ width: `${entry.percentage * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No errors recorded in this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Recent Errors (paginated) ── */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Recent Errors</CardTitle>
                  <CardDescription>
                    {pagination
                      ? `Showing ${recentErrors.length} of ${formatNumber(pagination.total)} errors${hasActiveFilters ? ' (filtered)' : ''}`
                      : 'Latest failed requests with error details — click to expand'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner />
              ) : recentErrors.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {recentErrors.map((error) => (
                      <ErrorCard key={error.id} error={error} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                        <span className="ml-2 text-muted-foreground/60">
                          ({formatNumber(pagination.total)} total)
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline" size="sm"
                          disabled={pagination.page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'No errors match your current filters. Try adjusting them.'
                    : 'No recent errors found. Your API calls are running smoothly.'}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
