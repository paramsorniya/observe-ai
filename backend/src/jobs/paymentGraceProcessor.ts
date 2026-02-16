import { prisma } from '../utils/prisma.js';
import { TIER_LIMITS } from '../utils/features.js';

const GRACE_PERIOD_DAYS = 7;

export async function runPaymentGraceProcessor() {
  console.log('[PaymentGraceProcessor] Checking past_due subscriptions...');

  const graceCutoff = new Date();
  graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS);

  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'past_due',
      paymentFailedAt: { lte: graceCutoff },
      subscriptionTier: { not: 'FREE' },
    },
  });

  console.log(`[PaymentGraceProcessor] Found ${users.length} users past grace period.`);

  for (const user of users) {
    try {
      // Cancel the Stripe subscription if possible
      if (user.stripeSubscriptionId) {
        try {
          const Stripe = require('stripe');
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (err) {
          console.error(`[PaymentGraceProcessor] Failed to cancel Stripe subscription for user ${user.id}:`, err);
        }
      }

      const limits = TIER_LIMITS.FREE;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'FREE',
            subscriptionStatus: 'active',
            stripeSubscriptionId: null,
            monthlyRequestLimit: limits.requests,
            projectLimit: limits.projects,
            paymentFailedAt: null,
            pendingDowngrade: false,
            downgradeDate: null,
            downgradeTo: null,
          },
        }),
        prisma.subscriptionHistory.create({
          data: {
            userId: user.id,
            event: 'downgraded',
            oldTier: user.subscriptionTier,
            newTier: 'FREE',
            reason: `Auto-downgraded after ${GRACE_PERIOD_DAYS}-day payment grace period`,
          },
        }),
      ]);

      console.log(
        `[PaymentGraceProcessor] User ${user.id}: auto-downgraded ${user.subscriptionTier} -> FREE (payment failed ${GRACE_PERIOD_DAYS}+ days ago)`
      );
    } catch (err) {
      console.error(`[PaymentGraceProcessor] Failed to process user ${user.id}:`, err);
    }
  }

  console.log('[PaymentGraceProcessor] Processing complete.');
}
