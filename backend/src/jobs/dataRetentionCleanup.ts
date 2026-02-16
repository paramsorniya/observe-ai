import { prisma } from '../utils/prisma.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier } from '@prisma/client';

const TIERS_TO_CLEAN: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO'];

export async function runDataRetentionCleanup() {
  console.log('[DataRetention] Starting daily cleanup...');

  for (const tier of TIERS_TO_CLEAN) {
    const retentionDays = TIER_LIMITS[tier].retentionDays;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    try {
      const projectIds = await prisma.project.findMany({
        where: {
          user: { subscriptionTier: tier },
        },
        select: { id: true },
      });

      if (projectIds.length === 0) continue;

      const ids = projectIds.map((p) => p.id);

      const result = await prisma.request.deleteMany({
        where: {
          projectId: { in: ids },
          timestamp: { lt: cutoff },
        },
      });

      console.log(
        `[DataRetention] ${tier}: deleted ${result.count} requests older than ${retentionDays} days`
      );
    } catch (err) {
      console.error(`[DataRetention] Error cleaning ${tier} tier:`, err);
    }
  }

  console.log('[DataRetention] Cleanup complete.');
}
