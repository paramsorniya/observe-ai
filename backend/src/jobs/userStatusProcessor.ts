import { prisma } from '../utils/prisma.js';
import type { UserStatus } from '@prisma/client';

/**
 * Calculates and updates user_status for all non-admin users.
 *
 * Rules:
 * - If subscriptionStatus === 'canceled' → churned
 * - If no firstApiCallAt (never made an API call) → ghost
 * - If lastApiCallAt within 7 days → active
 * - If lastApiCallAt between 7–14 days ago → integrated (warning zone)
 * - If lastApiCallAt > 14 days ago → dormant
 */
export async function runUserStatusProcessor(): Promise<void> {
  console.log('[UserStatusProcessor] Starting user status update...');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Churned: canceled subscription
  const churned = await prisma.user.updateMany({
    where: {
      isAdmin: false,
      subscriptionStatus: 'canceled',
      userStatus: { not: 'churned' },
    },
    data: { userStatus: 'churned' },
  });

  // 2. Ghost: never made an API call (and not canceled)
  const ghosts = await prisma.user.updateMany({
    where: {
      isAdmin: false,
      firstApiCallAt: null,
      subscriptionStatus: { not: 'canceled' },
      userStatus: { not: 'ghost' },
    },
    data: { userStatus: 'ghost' },
  });

  // 3. Active: last API call within 7 days (and not canceled)
  const active = await prisma.user.updateMany({
    where: {
      isAdmin: false,
      subscriptionStatus: { not: 'canceled' },
      firstApiCallAt: { not: null },
      lastApiCallAt: { gte: sevenDaysAgo },
      userStatus: { not: 'active' },
    },
    data: { userStatus: 'active' },
  });

  // 4. Integrated (warning zone): last API call 7–14 days ago
  const integrated = await prisma.user.updateMany({
    where: {
      isAdmin: false,
      subscriptionStatus: { not: 'canceled' },
      firstApiCallAt: { not: null },
      lastApiCallAt: {
        lt: sevenDaysAgo,
        gte: fourteenDaysAgo,
      },
      userStatus: { not: 'integrated' },
    },
    data: { userStatus: 'integrated' },
  });

  // 5. Dormant: last API call > 14 days ago
  const dormant = await prisma.user.updateMany({
    where: {
      isAdmin: false,
      subscriptionStatus: { not: 'canceled' },
      firstApiCallAt: { not: null },
      lastApiCallAt: { lt: fourteenDaysAgo },
      userStatus: { not: 'dormant' },
    },
    data: { userStatus: 'dormant' },
  });

  console.log(
    `[UserStatusProcessor] Updated — churned: ${churned.count}, ghost: ${ghosts.count}, ` +
    `active: ${active.count}, integrated: ${integrated.count}, dormant: ${dormant.count}`
  );
}
