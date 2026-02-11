import { useState } from 'react';
import { Check, Zap, Crown, Building } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    icon: Zap,
    description: 'Get started with AI observability',
    features: [
      '10,000 requests/month',
      '1 project',
      '7-day data retention',
      'Request logging',
      'Basic cost tracking',
      'Error monitoring',
      'Dashboard',
    ],
    limits: { requests: '10K', projects: '1', retention: '7 days' },
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 19,
    icon: Zap,
    description: 'For growing projects',
    popular: true,
    features: [
      '100,000 requests/month',
      '5 projects',
      '30-day data retention',
      'Everything in Free',
      'Cost optimization suggestions',
      'Tool/API call tracking',
      'CSV export',
      'Custom date ranges',
    ],
    limits: { requests: '100K', projects: '5', retention: '30 days' },
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 49,
    icon: Crown,
    description: 'For teams and power users',
    features: [
      '1,000,000 requests/month',
      'Unlimited projects',
      '90-day data retention',
      'Everything in Starter',
      'Advanced analytics',
      'API access',
      'Webhook integrations',
      'Team collaboration (up to 10)',
    ],
    limits: { requests: '1M', projects: 'Unlimited', retention: '90 days' },
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: null,
    icon: Building,
    description: 'For large organizations',
    features: [
      'Unlimited requests',
      'Unlimited projects',
      'Custom data retention',
      'Everything in Pro',
      'SSO/SAML',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
    ],
    limits: { requests: 'Unlimited', projects: 'Unlimited', retention: 'Custom' },
  },
];

export default function UpgradePage() {
  const user = useAuthStore((s) => s.user);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const res = await api.post('/subscriptions/create-checkout', { plan: planId });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await api.post('/subscriptions/create-portal');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to open billing portal');
    }
  };

  const currentTier = user?.subscriptionTier ?? 'FREE';
  const tierOrder = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
  const currentIndex = tierOrder.indexOf(currentTier);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-1">
          Scale your AI observability as your project grows
        </p>
        {currentTier !== 'FREE' && (
          <Button variant="outline" size="sm" className="mt-3" onClick={handleManageBilling}>
            Manage Billing
          </Button>
        )}
      </div>

      {user?.pendingDowngrade && user.downgradeDate && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm text-yellow-800">
            Your plan is scheduled to downgrade to {user.downgradeTo} on{' '}
            {new Date(user.downgradeDate).toLocaleDateString()}.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const planIndex = tierOrder.indexOf(plan.id);
          const isDowngrade = planIndex < currentIndex;
          const isUpgrade = planIndex > currentIndex;
          const Icon = plan.icon;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-primary shadow-md',
                isCurrent && 'ring-2 ring-primary'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  {plan.price !== null ? (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold">Custom</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.id === 'ENTERPRISE' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:support@observeai.com">Contact Sales</a>
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loadingPlan === plan.id}
                    >
                      {loadingPlan === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageBilling}
                    >
                      Downgrade
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
