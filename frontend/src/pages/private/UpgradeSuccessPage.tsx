import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const TIER_DETAILS: Record<string, { name: string; features: string[] }> = {
  STARTER: {
    name: 'Starter',
    features: [
      '100,000 requests/month',
      '5 projects',
      '30-day data retention',
      'Cost optimization suggestions',
      'Tool/API call tracking',
      'CSV export',
    ],
  },
  PRO: {
    name: 'Pro',
    features: [
      '1,000,000 requests/month',
      'Unlimited projects',
      '90-day data retention',
      'Advanced analytics',
      'API access',
      'Webhook integrations',
      'Team collaboration (up to 10)',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    features: [
      'Unlimited requests',
      'Unlimited projects',
      'Custom data retention',
      'SSO/SAML',
      'Dedicated support',
    ],
  },
};

export default function UpgradeSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function refreshProfile() {
      try {
        const res = await api.get('/user/profile');
        updateUser(res.data.user);
      } catch {
        // Profile refresh failed, user will see stale data but that's ok
      } finally {
        setLoading(false);
      }
    }
    refreshProfile();
  }, [updateUser]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const tier = user?.subscriptionTier ?? 'STARTER';
  const details = TIER_DETAILS[tier];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">
            Welcome to {details?.name ?? tier}!
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            Your subscription is now active. Here's what you get:
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {details && (
            <ul className="space-y-2 text-left mx-auto max-w-xs">
              {details.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
            <Link to="/dashboard/settings">
              <Button variant="outline">Manage Projects</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
