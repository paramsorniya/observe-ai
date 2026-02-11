import type { SubscriptionTier } from '@prisma/client';

interface FeatureConfig {
  tiers: SubscriptionTier[];
  description: string;
}

export const FEATURE_MATRIX: Record<string, FeatureConfig> = {
  request_logging: {
    tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Log and view API requests',
  },
  cost_tracking_basic: {
    tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Basic cost tracking',
  },
  error_monitoring: {
    tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Error detection and monitoring',
  },
  cost_optimization: {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Cost optimization suggestions',
  },
  tool_tracking: {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Track tool/function calls',
  },
  export_csv: {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Export data as CSV',
  },
  custom_date_ranges: {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Custom date range filtering',
  },
  advanced_analytics: {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Advanced analytics and insights',
  },
  api_access: {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Programmatic API access',
  },
  webhooks: {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Webhook notifications',
  },
  team_collaboration: {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Team member management',
  },
  sso: {
    tiers: ['ENTERPRISE'],
    description: 'SSO/SAML integration',
  },
};

export function canAccessFeature(tier: SubscriptionTier, feature: string): boolean {
  const config = FEATURE_MATRIX[feature];
  if (!config) return false;
  return config.tiers.includes(tier);
}

export function getMinimumTier(feature: string): SubscriptionTier | null {
  const config = FEATURE_MATRIX[feature];
  if (!config) return null;
  return config.tiers[0];
}

export const TIER_LIMITS: Record<SubscriptionTier, { requests: number; projects: number; retentionDays: number; teamMembers: number }> = {
  FREE: { requests: 10000, projects: 1, retentionDays: 7, teamMembers: 1 },
  STARTER: { requests: 100000, projects: 5, retentionDays: 30, teamMembers: 3 },
  PRO: { requests: 1000000, projects: 999, retentionDays: 90, teamMembers: 10 },
  ENTERPRISE: { requests: 999999999, projects: 999, retentionDays: 365, teamMembers: 999 },
};
