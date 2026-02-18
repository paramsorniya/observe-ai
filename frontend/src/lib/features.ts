type Tier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

const FEATURE_MATRIX: Record<string, { tiers: Tier[]; label: string }> = {
  request_logging:    { tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'], label: 'Request Logging' },
  cost_tracking_basic:{ tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'], label: 'Cost Tracking' },
  error_monitoring:   { tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'], label: 'Error Monitoring' },
  cost_optimization:  { tiers: ['STARTER', 'PRO', 'ENTERPRISE'], label: 'Cost Optimization' },
  tool_tracking:      { tiers: ['STARTER', 'PRO', 'ENTERPRISE'], label: 'Tool Tracking' },
  export_csv:         { tiers: ['STARTER', 'PRO', 'ENTERPRISE'], label: 'CSV Export' },
  custom_date_ranges: { tiers: ['STARTER', 'PRO', 'ENTERPRISE'], label: 'Custom Date Ranges' },
  advanced_analytics: { tiers: ['PRO', 'ENTERPRISE'], label: 'Advanced Analytics' },
  api_access:         { tiers: ['PRO', 'ENTERPRISE'], label: 'API Access' },
};

/** Data retention window per tier — must stay in sync with backend TIER_LIMITS */
export const TIER_RETENTION_DAYS: Record<Tier, number> = {
  FREE:       7,
  STARTER:    30,
  PRO:        90,
  ENTERPRISE: 365,
};

export function canAccessFeature(tier: Tier | undefined, feature: string): boolean {
  if (!tier) return false;
  const config = FEATURE_MATRIX[feature];
  if (!config) return false;
  return config.tiers.includes(tier);
}

export function getMinimumTier(feature: string): Tier | null {
  return FEATURE_MATRIX[feature]?.tiers[0] || null;
}

export { FEATURE_MATRIX };
export type { Tier };
