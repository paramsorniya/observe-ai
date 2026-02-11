import { useAuthStore } from '@/store/authStore';
import { canAccessFeature, getMinimumTier } from '@/lib/features';

export function useFeatureAccess(feature: string) {
  const user = useAuthStore((s) => s.user);
  const hasAccess = canAccessFeature(user?.subscriptionTier, feature);
  const minimumPlan = getMinimumTier(feature);
  return { hasAccess, minimumPlan, showUpgrade: !hasAccess };
}
