import { useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, X, Download,
  ChevronUp, ChevronDown, ChevronsUpDown,
  DollarSign, Zap, Clock, AlertTriangle, Activity,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useRequests, useRequestStats } from '@/hooks/useRequests';
import { canAccessFeature, TIER_RETENTION_DAYS } from '@/lib/features';
import { formatCost, formatNumber, formatDate, cn } from '@/lib/utils';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ApiRequest } from '@/types';

type SortField = 'timestamp' | 'totalCost' | 'latencyMs' | 'totalTokens';

const PROVIDER_BADGE: Record<string, string> = {
  openai:    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  anthropic: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  gemini:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
};

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10); }

function SortIcon({ field, sortBy, sortOrder }: { field: SortField; sortBy: SortField; sortOrder: 'asc' | 'desc' }) {
  if (sortBy !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 text-muted-foreground/40" />;
  return sortOrder === 'asc'
    ? <ChevronUp className="h-3 w-3 ml-1 text-primary" />
    : <ChevronDown className="h-3 w-3 ml-1 text-primary" />;
}

export default function RequestsPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const userTier = useAuthStore((s) => s.user?.subscriptionTier);

  // Plan-derived limits
  const tier = (userTier ?? 'FREE') as keyof typeof TIER_RETENTION_DAYS;
  const retentionDays = TIER_RETENTION_DAYS[tier];
  const canCustomDate = canAccessFeature(userTier, 'custom_date_ranges');
  /** Earliest date the user is allowed to query — based on their retention window */
  const minAllowedDate = daysAgo(retentionDays - 1);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
  const [exporting, setExporting] = useState(false);

  const sharedFilters = {
    search: search || undefined,
    status: statusFilter || undefined,
    model: modelFilter || undefined,
    provider: providerFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const { data, isLoading } = useRequests(currentProjectId, {
    ...sharedFilters,
    page,
    limit: 100,
    sortBy,
    sortOrder,
  });

  const { data: stats, isLoading: statsLoading } = useRequestStats(currentProjectId, sharedFilters);

  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  const hasActiveFilters = !!(search || statusFilter || modelFilter || providerFilter || fromDate || toDate);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function resetPage() { setPage(1); setSelectedRequest(null); }

  function clearAll() {
    setSearch(''); setStatusFilter(''); setModelFilter('');
    setProviderFilter(''); setFromDate(''); setToDate('');
    setPage(1); setSelectedRequest(null);
  }

  function applyPreset(preset: 'today' | '7d' | '30d' | '90d' | '365d') {
    const end = today();
    const start =
      preset === 'today'  ? today()     :
      preset === '7d'     ? daysAgo(6)  :
      preset === '30d'    ? daysAgo(29) :
      preset === '90d'    ? daysAgo(89) :
                            daysAgo(364);
    setFromDate(start); setToDate(end); resetPage();
  }

  const handleExportCsv = async () => {
    if (!currentProjectId) return;
    setExporting(true);
    try {
      const res = await api.get('/requests/export', {
        params: { projectId: currentProjectId },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'requests.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Log</h1>
          <p className="text-muted-foreground">Browse, filter and analyse all your AI API calls</p>
        </div>
        {canAccessFeature(userTier, 'export_csv') && currentProjectId && (
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        )}
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Row 1: search + status + model + provider */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompt, response, model…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); resetPage(); }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>
            <Input
              placeholder="Filter by model"
              value={modelFilter}
              onChange={(e) => { setModelFilter(e.target.value); resetPage(); }}
              className="sm:w-44"
            />
          </div>

          {/* Row 2: date range + presets + clear */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Date range:</span>

            {canCustomDate ? (
              <>
                <input
                  type="date"
                  value={fromDate}
                  min={minAllowedDate}
                  max={today()}
                  onChange={(e) => { setFromDate(e.target.value); resetPage(); }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground text-sm">→</span>
                <input
                  type="date"
                  value={toDate}
                  min={minAllowedDate}
                  max={today()}
                  onChange={(e) => { setToDate(e.target.value); resetPage(); }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </>
            ) : (
              <span
                title={`Custom date ranges require Starter or higher. Your plan retains ${retentionDays} days of data.`}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-dashed border-input bg-muted/40 text-xs text-muted-foreground cursor-not-allowed select-none"
              >
                🔒 Custom range — Starter+
              </span>
            )}

            {/* Presets — only show what fits within the user's retention window */}
            <div className="flex gap-1 flex-wrap">
              <Button
                variant="outline" size="sm" className="h-9 px-3 text-xs"
                onClick={() => applyPreset('today')}
              >
                Today
              </Button>
              <Button
                variant="outline" size="sm" className="h-9 px-3 text-xs"
                onClick={() => applyPreset('7d')}
              >
                Last 7 days
              </Button>
              {retentionDays >= 30 && (
                <Button
                  variant="outline" size="sm" className="h-9 px-3 text-xs"
                  onClick={() => applyPreset('30d')}
                >
                  Last 30 days
                </Button>
              )}
              {retentionDays >= 90 && (
                <Button
                  variant="outline" size="sm" className="h-9 px-3 text-xs"
                  onClick={() => applyPreset('90d')}
                >
                  Last 90 days
                </Button>
              )}
              {retentionDays >= 365 && (
                <Button
                  variant="outline" size="sm" className="h-9 px-3 text-xs"
                  onClick={() => applyPreset('365d')}
                >
                  Last 365 days
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearAll}>
                <X className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Retention notice for FREE tier */}
          {tier === 'FREE' && (
            <p className="text-xs text-muted-foreground">
              Your plan stores the last <strong>7 days</strong> of requests.{' '}
              <a href="/dashboard/upgrade" className="text-primary underline hover:no-underline">
                Upgrade to Starter
              </a>{' '}
              for 30-day history and custom date filters.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Aggregate Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Total Requests',
            icon: Activity,
            value: statsLoading ? '…' : formatNumber(stats?.totalRequests ?? 0),
            sub: pagination ? `${formatNumber(pagination.total)} filtered` : undefined,
          },
          {
            label: 'Total Cost',
            icon: DollarSign,
            value: statsLoading ? '…' : formatCost(stats?.totalCost ?? 0),
          },
          {
            label: 'Total Tokens',
            icon: Zap,
            value: statsLoading ? '…' : formatNumber(stats?.totalTokens ?? 0),
          },
          {
            label: 'Avg Latency',
            icon: Clock,
            value: statsLoading ? '…' : `${formatNumber(stats?.avgLatency ?? 0)}ms`,
          },
          {
            label: 'Error Rate',
            icon: AlertTriangle,
            value: statsLoading ? '…' : `${stats?.errorRate ?? 0}%`,
            valueClass: (stats?.errorRate ?? 0) > 5 ? 'text-destructive' : '',
            sub: statsLoading ? undefined : `${formatNumber(stats?.errorCount ?? 0)} errors`,
          },
        ].map(({ label, icon: Icon, value, sub, valueClass }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className={cn('text-xl font-bold', valueClass)}>{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Requests Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requests</CardTitle>
          {pagination && (
            <CardDescription>
              Showing {requests.length} of {formatNumber(pagination.total)} requests
              {hasActiveFilters && ' (filtered)'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No requests found"
              description={hasActiveFilters ? 'No requests match your current filters. Try adjusting them.' : 'Start making AI API calls — they will appear here.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      {/* Sortable: Time */}
                      <th
                        className="pb-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                        onClick={() => handleSort('timestamp')}
                      >
                        <span className="inline-flex items-center">
                          Time <SortIcon field="timestamp" sortBy={sortBy} sortOrder={sortOrder} />
                        </span>
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">Provider</th>
                      <th className="pb-3 font-medium text-muted-foreground">Model</th>
                      {/* Sortable: Tokens */}
                      <th
                        className="pb-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                        onClick={() => handleSort('totalTokens')}
                      >
                        <span className="inline-flex items-center">
                          Tokens <SortIcon field="totalTokens" sortBy={sortBy} sortOrder={sortOrder} />
                        </span>
                      </th>
                      {/* Sortable: Cost */}
                      <th
                        className="pb-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                        onClick={() => handleSort('totalCost')}
                      >
                        <span className="inline-flex items-center">
                          Cost <SortIcon field="totalCost" sortBy={sortBy} sortOrder={sortOrder} />
                        </span>
                      </th>
                      {/* Sortable: Latency */}
                      <th
                        className="pb-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                        onClick={() => handleSort('latencyMs')}
                      >
                        <span className="inline-flex items-center">
                          Latency <SortIcon field="latencyMs" sortBy={sortBy} sortOrder={sortOrder} />
                        </span>
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className={cn(
                          'border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors',
                          selectedRequest?.id === req.id && 'bg-muted/50'
                        )}
                        onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
                      >
                        <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(req.timestamp)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            PROVIDER_BADGE[req.provider] ?? 'bg-muted text-muted-foreground'
                          )}>
                            {req.provider}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="secondary">{req.model}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span title={`Prompt: ${req.promptTokens} / Completion: ${req.completionTokens}`}>
                            {formatNumber(req.totalTokens)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-medium">{formatCost(req.totalCost)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{req.latencyMs}ms</td>
                        <td className="py-2.5">
                          <Badge variant={req.status === 'success' ? 'success' : 'destructive'}>
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Request Detail Panel ── */}
              {selectedRequest && (
                <div className="mt-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Request Detail</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p className="text-sm font-medium">{selectedRequest.provider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="text-sm font-medium">{selectedRequest.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Endpoint</p>
                      <p className="text-sm font-medium">{selectedRequest.endpoint || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Session ID</p>
                      <p className="text-sm font-medium font-mono truncate">{selectedRequest.sessionId || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Prompt Tokens</p>
                      <p className="text-sm font-medium">{formatNumber(selectedRequest.promptTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completion Tokens</p>
                      <p className="text-sm font-medium">{formatNumber(selectedRequest.completionTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-sm font-medium">{formatCost(selectedRequest.totalCost)}</p>
                    </div>
                  </div>

                  {selectedRequest.prompt && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                      <pre className="text-sm bg-background border rounded-md p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedRequest.prompt}
                      </pre>
                    </div>
                  )}

                  {selectedRequest.response && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Response</p>
                      <pre className="text-sm bg-background border rounded-md p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedRequest.response}
                      </pre>
                    </div>
                  )}

                  {selectedRequest.errorMessage && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Error</p>
                      <div className="text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="font-medium text-destructive">{selectedRequest.errorType}</p>
                        <p className="text-destructive/80 mt-1">{selectedRequest.errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.toolCalls && selectedRequest.toolCalls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Tool Calls ({selectedRequest.toolCalls.length})
                      </p>
                      <div className="space-y-2">
                        {selectedRequest.toolCalls.map((tool) => (
                          <div key={tool.id} className="bg-background border rounded-md p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{tool.toolName}</span>
                              <Badge variant={tool.status === 'success' ? 'success' : 'destructive'}>
                                {tool.status}
                              </Badge>
                              {tool.latencyMs && (
                                <span className="text-xs text-muted-foreground">{tool.latencyMs}ms</span>
                              )}
                            </div>
                            {tool.toolInput && (
                              <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto">{tool.toolInput}</pre>
                            )}
                            {tool.toolOutput && (
                              <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto max-h-32 overflow-y-auto">{tool.toolOutput}</pre>
                            )}
                            {tool.errorMessage && (
                              <p className="text-xs text-destructive mt-1">{tool.errorMessage}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRequest.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Pagination ── */}
              {pagination && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages || 1}
                    <span className="ml-2 text-muted-foreground/60">
                      ({formatNumber(pagination.total)} total)
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => { setPage((p) => p - 1); setSelectedRequest(null); }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => { setPage((p) => p + 1); setSelectedRequest(null); }}
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
    </div>
  );
}
