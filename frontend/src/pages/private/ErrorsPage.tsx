import { AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useErrorStats } from '@/hooks/useDashboardStats';
import { formatNumber, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ErrorsPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const { data: errorStats, isLoading } = useErrorStats(currentProjectId);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!errorStats) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No error data available"
        description="Error data will appear here once your project starts processing requests."
      />
    );
  }

  const errorRate = errorStats.errorRate ?? 0;
  const totalErrors = errorStats.totalErrors ?? 0;
  const totalRequests = errorStats.totalRequests ?? 0;
  const errorsByType = errorStats.errorsByType ?? [];
  const recentErrors = errorStats.recentErrors ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Monitoring</h1>
        <p className="text-muted-foreground">
          Track and diagnose errors in your AI API calls
        </p>
      </div>

      {/* Error Rate Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(errorRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of all requests in the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalErrors)}</div>
            <p className="text-xs text-muted-foreground mt-1">In the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRequests)}</div>
            <p className="text-xs text-muted-foreground mt-1">In the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Errors by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Errors by Type</CardTitle>
          <CardDescription>Breakdown of error categories</CardDescription>
        </CardHeader>
        <CardContent>
          {errorsByType.length > 0 ? (
            <div className="space-y-3">
              {errorsByType.map(
                (entry: { type: string; count: number; percentage: number }) => (
                  <div key={entry.type} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {entry.type}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {entry.count} ({(entry.percentage * 100).toFixed(1)}%)
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
                )
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No errors recorded in this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Errors</CardTitle>
          <CardDescription>
            Latest failed requests with error details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentErrors.length > 0 ? (
            <div className="space-y-3">
              {recentErrors.map(
                (error: {
                  id: string;
                  timestamp: string;
                  model: string;
                  errorType: string;
                  errorMessage: string;
                  latencyMs: number;
                }) => (
                  <div
                    key={error.id}
                    className="border rounded-lg p-4 bg-destructive/5 border-destructive/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">{error.errorType}</Badge>
                          <Badge variant="secondary">{error.model}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {error.latencyMs}ms
                          </span>
                        </div>
                        <p className="text-sm text-destructive/80 mt-1">
                          {error.errorMessage}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(error.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent errors found. Your API calls are running smoothly.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
