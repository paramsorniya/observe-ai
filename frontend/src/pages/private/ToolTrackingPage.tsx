import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import api from '@/lib/axios';
import { formatDate, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeatureLockedScreen } from '@/components/shared/FeatureLockedScreen';

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

interface ToolStatsData {
  totalCalls: number;
  failedCalls: number;
  successRate: number;
  byTool: ToolStat[];
  recentFailed: FailedCall[];
}

export default function ToolTrackingPage() {
  const { hasAccess, minimumPlan } = useFeatureAccess('tool_tracking');
  const currentProjectId = useAppStore((s) => s.currentProjectId);

  const [data, setData] = useState<ToolStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAccess || !currentProjectId) {
      setIsLoading(false);
      return;
    }

    const fetchToolStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/stats/tools', {
          params: { projectId: currentProjectId },
        });
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load tool stats.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToolStats();
  }, [hasAccess, currentProjectId]);

  if (!hasAccess) {
    return (
      <FeatureLockedScreen
        feature="Tool Tracking"
        minimumPlan={minimumPlan ?? 'STARTER'}
      />
    );
  }

  if (isLoading) return <LoadingSpinner size="lg" />;

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load tool stats"
        description={error}
      />
    );
  }

  if (!data) return null;

  const maxCount = Math.max(...data.byTool.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tool Tracking</h1>
        <p className="text-muted-foreground">
          Monitor which tools and functions your AI is calling
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.failedCalls} failed of {data.totalCalls}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Tools</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.byTool.length}</div>
            <p className="text-xs text-muted-foreground">Distinct tools used</p>
          </CardContent>
        </Card>
      </div>

      {/* Tool Breakdown */}
      {data.byTool.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tool Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.byTool.map((tool) => (
                <div key={tool.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{tool.name}</span>
                      <span className="text-muted-foreground">
                        avg {tool.avgLatency}ms
                      </span>
                    </div>
                    <span className="font-medium">{tool.count.toLocaleString()} calls</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(tool.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Wrench}
          title="No tool calls recorded"
          description="Tool call data will appear here once your AI starts making function calls."
        />
      )}

      {/* Recent Failed Calls */}
      {data.recentFailed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Recent Failed Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentFailed.map((call) => (
                <div
                  key={call.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Error</Badge>
                      <span className="font-mono text-sm font-medium">
                        {call.toolName}
                      </span>
                      {call.latencyMs != null && (
                        <span className="text-xs text-muted-foreground">
                          {call.latencyMs}ms
                        </span>
                      )}
                    </div>
                    {call.errorMessage && (
                      <p className="text-sm text-muted-foreground">
                        {call.errorMessage}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(call.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
