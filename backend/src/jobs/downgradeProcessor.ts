import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier } from '@prisma/client';

export async function runDowngradeProcessor() {
  console.log('[DowngradeProcessor] Starting scheduled downgrade processing...');

  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      pendingDowngrade: true,
      downgradeDate: { lte: now },
    },
    include: {
      projects: { orderBy: { createdAt: 'desc' } },
    },
  });

  console.log(`[DowngradeProcessor] Found ${users.length} users to downgrade.`);

  for (const user of users) {
    try {
      const targetTier = (user.downgradeTo ?? 'FREE') as SubscriptionTier;
      const limits = TIER_LIMITS[targetTier];
      const retentionDays = limits.retentionDays;
      const retentionCutoff = new Date();
      retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);

      // Determine which projects to keep
      const projectsToKeep = (user.projectsToKeep as string[] | null) ?? [];
      const activeProjects = user.projects.filter((p) => p.isActive);

      let keepIds: string[];
      if (projectsToKeep.length > 0) {
        // User pre-selected which projects to keep
        keepIds = projectsToKeep.slice(0, limits.projects);
      } else {
        // Auto-select most recently created active projects
        keepIds = activeProjects.slice(0, limits.projects).map((p) => p.id);
      }

      const disableIds = activeProjects
        .filter((p) => !keepIds.includes(p.id))
        .map((p) => p.id);

      const allProjectIds = user.projects.map((p) => p.id);

      await prisma.$transaction([
        // 1. Update user tier and limits
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: targetTier,
            subscriptionStatus: 'active',
            monthlyRequestLimit: limits.requests,
            monthlyRequestCount: 0,
            projectLimit: limits.projects,
            pendingDowngrade: false,
            downgradeDate: null,
            downgradeTo: null,
            projectsToKeep: Prisma.DbNull,
          },
        }),
        // 2. Disable excess projects
        ...(disableIds.length > 0
          ? [
              prisma.project.updateMany({
                where: { id: { in: disableIds } },
                data: { isActive: false },
              }),
            ]
          : []),
        // 3. Delete requests older than new tier's retention
        prisma.request.deleteMany({
          where: {
            projectId: { in: allProjectIds },
            timestamp: { lt: retentionCutoff },
          },
        }),
        // 4. Log to subscription history
        prisma.subscriptionHistory.create({
          data: {
            userId: user.id,
            event: 'downgraded',
            oldTier: user.subscriptionTier,
            newTier: targetTier,
            reason: 'Scheduled downgrade executed',
          },
        }),
      ]);

      console.log(
        `[DowngradeProcessor] User ${user.id}: downgraded ${user.subscriptionTier} → ${targetTier}, disabled ${disableIds.length} projects`
      );
    } catch (err) {
      console.error(`[DowngradeProcessor] Failed to downgrade user ${user.id}:`, err);
    }
  }

  console.log('[DowngradeProcessor] Processing complete.');
}
