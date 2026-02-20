import { useState, useEffect } from 'react';
import { TrendingDown, Lightbulb, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import api from '@/lib/axios';
import { formatCost, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeatureLockedScreen } from '@/components/shared/FeatureLockedScreen';

interface OptimizationSuggestion {
  id: string;
  type: 'model_switch' | 'prompt_optimization' | 'caching' | 'batching' | 'general';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedSavings: number;
}

const impactConfig = {
  low: { label: 'Low Impact', variant: 'outline' as const, color: 'text-muted-foreground' },
  medium: { label: 'Medium Impact', variant: 'warning' as const, color: 'text-yellow-700' },
  high: { label: 'High Impact', variant: 'destructive' as const, color: 'text-green-700' },
};

const typeIcons: Record<string, React.ElementType> = {
  model_switch: TrendingDown,
  prompt_optimization: Lightbulb,
  caching: Zap,
  batching: Zap,
  general: Lightbulb,
};

export default function OptimizationPage() {
  const { hasAccess, minimumPlan } = useFeatureAccess('cost_optimization');
  const currentProjectId = useAppStore((s) => s.currentProjectId);

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAccess || !currentProjectId) {
      setIsLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/stats/optimization', {
          params: { projectId: currentProjectId },
        });
        setSuggestions(res.data.suggestions ?? res.data ?? []);
      } catch (err: any) {
        setError(
          err.response?.data?.error || 'Failed to load optimization suggestions.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [hasAccess, currentProjectId]);

  if (!hasAccess) {
    return (
      <FeatureLockedScreen
        feature="Cost Optimization"
        minimumPlan={minimumPlan ?? 'STARTER'}
      />
    );
  }

  const totalPotentialSavings = suggestions.reduce(
    (sum, s) => sum + s.estimatedSavings,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header — always visible */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cost Optimization</h1>
        <p className="text-muted-foreground">
          Actionable suggestions to reduce your AI API spending
        </p>
      </div>

      {isLoading ? <LoadingSpinner size="lg" /> : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load suggestions"
          description={error}
        />
      ) : (<>

      {/* Savings Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">
              Potential Monthly Savings
            </CardTitle>
            <CardDescription>
              Estimated savings if all suggestions are applied
            </CardDescription>
          </div>
          <DollarSign className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCost(totalPotentialSavings)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {suggestions.length} optimization{suggestions.length !== 1 ? 's' : ''}{' '}
            found
          </p>
        </CardContent>
      </Card>

      {/* Suggestion Cards */}
      {suggestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => {
            const Icon = typeIcons[suggestion.type] || Lightbulb;
            const impact = impactConfig[suggestion.impact];

            return (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {suggestion.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={impact.variant}>{impact.label}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {suggestion.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-sm font-medium text-green-700'
                    )}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Estimated savings: {formatCost(suggestion.estimatedSavings)}/mo
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="No optimization suggestions"
          description="Great job! We haven't found any optimization opportunities yet. Keep monitoring as your usage grows."
        />
      )}
      </>)}
    </div>
  );
}
