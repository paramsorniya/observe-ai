import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Building, AlertTriangle, X, Send } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types';

const TIER_PROJECT_LIMITS: Record<string, number> = {
  FREE: 1,
  STARTER: 5,
  PRO: 999,
  ENTERPRISE: 999,
};

const TIER_RETENTION: Record<string, string> = {
  FREE: '7 days',
  STARTER: '30 days',
  PRO: '90 days',
  ENTERPRISE: '365 days',
};

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
    name: 'Pro',
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
    name: 'Pro Plus',
    price: 49,
    icon: Crown,
    description: 'For teams and power users',
    features: [
      '1,000,000 requests/month',
      'Unlimited projects',
      '90-day data retention',
      'Everything in Pro',
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
      'Everything in Pro Plus',
      'SSO/SAML',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
    ],
    limits: { requests: 'Unlimited', projects: 'Unlimited', retention: 'Custom' },
  },
];

function DowngradeModal({
  targetTier,
  currentTier,
  onClose,
  onSuccess,
}: {
  targetTier: string;
  currentTier: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maxProjects = TIER_PROJECT_LIMITS[targetTier] ?? 1;
  const targetPlan = PLANS.find((p) => p.id === targetTier);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await api.get('/projects');
        const activeProjects = (res.data.projects || res.data || []).filter(
          (p: Project) => p.isActive
        );
        setProjects(activeProjects);
        // Pre-select up to maxProjects (most recent first)
        setSelectedProjects(activeProjects.slice(0, maxProjects).map((p: Project) => p.id));
      } catch {
        setProjects([]);
      } finally {
        setFetchingProjects(false);
      }
    }
    fetchProjects();
  }, [maxProjects]);

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      }
      if (prev.length >= maxProjects) return prev;
      return [...prev, projectId];
    });
  };

  const handleConfirmDowngrade = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/subscriptions/downgrade', {
        targetTier,
        projectsToKeep: projects.length > maxProjects ? selectedProjects : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request downgrade');
    } finally {
      setLoading(false);
    }
  };

  const needsProjectSelection = projects.length > maxProjects;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold">Downgrade to {targetPlan?.name ?? targetTier}</h2>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">What changes when you downgrade:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Request limit changes to {targetPlan?.limits.requests ?? 'lower'}/month</li>
              <li>Project limit changes to {TIER_PROJECT_LIMITS[targetTier]}</li>
              <li>Data retention changes to {TIER_RETENTION[targetTier]}</li>
              <li>Downgrade takes effect at the end of your current billing period</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {needsProjectSelection && (
            <div>
              <p className="text-sm font-medium mb-2">
                Select up to {maxProjects} project{maxProjects !== 1 ? 's' : ''} to keep
                ({selectedProjects.length}/{maxProjects} selected):
              </p>
              {fetchingProjects ? (
                <p className="text-sm text-muted-foreground">Loading projects...</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {projects.map((project) => {
                    const isSelected = selectedProjects.includes(project.id);
                    return (
                      <label
                        key={project.id}
                        className={cn(
                          'flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-input'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProject(project.id)}
                          disabled={!isSelected && selectedProjects.length >= maxProjects}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Unselected projects will be deactivated but not deleted.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmDowngrade}
              disabled={loading || (needsProjectSelection && selectedProjects.length === 0)}
            >
              {loading ? 'Processing...' : 'Confirm Downgrade'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Sales Modal ─── */

function ContactSalesModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('');
  const [useCase, setUseCase] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role || !monthlyVolume || !useCase) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/enterprise/contact', {
        name,
        email: user?.email,
        company,
        role,
        monthlyVolume,
        useCase,
        phone: phone || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Request Received!</h2>
            <p className="text-muted-foreground text-sm">
              Thanks! Our team will contact you within 24 hours.
            </p>
            <button onClick={onClose} className="text-primary text-sm hover:underline">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" /> Contact Sales
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your needs and we'll set up a custom Enterprise plan for you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Your Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  value={user?.email || ''}
                  readOnly
                  className="mt-1 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Company <span className="text-destructive">*</span></label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Your Role <span className="text-destructive">*</span></label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="CTO / ML Engineer"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Monthly AI Request Volume <span className="text-destructive">*</span>
              </label>
              <select
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select estimated volume...</option>
                <option value="< 1M">Less than 1M / month</option>
                <option value="1M–5M">1M – 5M / month</option>
                <option value="5M–20M">5M – 20M / month</option>
                <option value="20M+">20M+ / month</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Use Case <span className="text-destructive">*</span>
              </label>
              <textarea
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Describe what you're building and how you'll use ObserveAI..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="+1 555 000 0000"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UpgradePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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

  const handleCancelDowngrade = async () => {
    setCancellingDowngrade(true);
    try {
      await api.post('/subscriptions/cancel-downgrade');
      // Refresh user profile
      const res = await api.get('/user/profile');
      updateUser(res.data.user);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel downgrade');
    } finally {
      setCancellingDowngrade(false);
    }
  };

  const handleDowngradeSuccess = async () => {
    setDowngradeTarget(null);
    // Refresh user profile to show pending downgrade state
    try {
      const res = await api.get('/user/profile');
      updateUser(res.data.user);
    } catch {
      // Fallback: reload page
      window.location.reload();
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
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-4 text-center space-y-2">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Your plan is scheduled to downgrade to {user.downgradeTo} on{' '}
            {new Date(user.downgradeDate).toLocaleDateString()}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelDowngrade}
            disabled={cancellingDowngrade}
          >
            {cancellingDowngrade ? 'Cancelling...' : 'Cancel Downgrade'}
          </Button>
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
                    currentTier === 'ENTERPRISE' ? (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" disabled>
                          You're on Enterprise
                        </Button>
                        <a
                          href="mailto:support@observeai.com"
                          className="block text-center text-xs text-primary hover:underline"
                        >
                          Contact Support
                        </a>
                      </div>
                    ) : (
                      <Button className="w-full" onClick={() => setShowContactModal(true)}>
                        Contact Sales
                      </Button>
                    )
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
                      onClick={() => setDowngradeTarget(plan.id)}
                      disabled={!!user?.pendingDowngrade}
                    >
                      {user?.pendingDowngrade ? 'Downgrade Pending' : 'Downgrade'}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {downgradeTarget && (
        <DowngradeModal
          targetTier={downgradeTarget}
          currentTier={currentTier}
          onClose={() => setDowngradeTarget(null)}
          onSuccess={handleDowngradeSuccess}
        />
      )}

      {showContactModal && (
        <ContactSalesModal
          user={user}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
}
