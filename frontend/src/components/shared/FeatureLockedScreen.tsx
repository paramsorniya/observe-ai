import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Pro Plus',
  ENTERPRISE: 'Enterprise',
};

interface FeatureLockedScreenProps {
  feature: string;
  minimumPlan: string;
}

export function FeatureLockedScreen({
  feature,
  minimumPlan,
}: FeatureLockedScreenProps) {
  const displayName = PLAN_DISPLAY_NAMES[minimumPlan] ?? minimumPlan;
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center pt-10 pb-8">
          <div className="rounded-full bg-muted p-4 mb-6">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Feature Locked</h2>
          <p className="text-muted-foreground mb-1">
            <span className="font-medium text-foreground">{feature}</span> is
            not available on your current plan.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Upgrade to the{' '}
            <span className="font-semibold text-primary">{displayName}</span>{' '}
            plan or higher to unlock this feature.
          </p>
          <Button asChild>
            <Link to="/dashboard/upgrade">Upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
