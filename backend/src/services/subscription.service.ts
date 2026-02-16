import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { AppError, NotFoundError } from '../errors/AppError.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier } from '@prisma/client';

const TIER_ORDER: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

export const requestDowngradeSchema = z.object({
  targetTier: z.enum(['FREE', 'STARTER', 'PRO']),
  projectsToKeep: z.array(z.string()).optional(),
});

function getStripe() {
  if (!config.STRIPE_SECRET_KEY) {
    throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
  }
  // Dynamic import to avoid issues when Stripe is not configured
  const Stripe = require('stripe');
  return new Stripe(config.STRIPE_SECRET_KEY);
}

const PRICE_MAP: Record<string, string | undefined> = {
  STARTER: config.STRIPE_PRICE_ID_STARTER,
  PRO: config.STRIPE_PRICE_ID_PRO,
};

export async function createCheckoutSession(userId: string, plan: string) {
  const stripe = getStripe();
  const priceId = PRICE_MAP[plan.toUpperCase()];
  if (!priceId) throw new AppError('Invalid plan', 400, 'INVALID_PLAN');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.FRONTEND_URL}/dashboard/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/dashboard/upgrade`,
    metadata: { userId, plan: plan.toUpperCase() },
  });

  return { url: session.url };
}

export async function createPortalSession(userId: string) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (!user.stripeCustomerId) throw new AppError('No billing account found', 400, 'NO_BILLING');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${config.FRONTEND_URL}/settings`,
  });

  return { url: session.url };
}

export async function handleWebhookEvent(event: any) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan as SubscriptionTier;
      if (!userId || !plan) break;

      const limits = TIER_LIMITS[plan];
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) break;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: plan,
            subscriptionStatus: 'active',
            stripeSubscriptionId: session.subscription,
            monthlyRequestLimit: limits.requests,
            projectLimit: limits.projects,
            currentPeriodEnd: session.current_period_end
              ? new Date(session.current_period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            pendingDowngrade: false,
            downgradeDate: null,
            downgradeTo: null,
          },
        }),
        prisma.subscriptionHistory.create({
          data: {
            userId,
            event: 'upgraded',
            oldTier: user.subscriptionTier,
            newTier: plan,
            reason: 'Checkout completed',
          },
        }),
      ]);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!user) break;

      // Handle status changes (e.g. past_due -> active after card update)
      const stripeStatus = subscription.status as string;
      if (stripeStatus === 'active' && user.subscriptionStatus !== 'active') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'active',
            paymentFailedAt: null,
          },
        });
      } else if (stripeStatus === 'past_due' && user.subscriptionStatus !== 'past_due') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'past_due',
            paymentFailedAt: user.paymentFailedAt ?? new Date(),
          },
        });
      } else if (stripeStatus === 'canceled') {
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
            },
          }),
          prisma.subscriptionHistory.create({
            data: {
              userId: user.id,
              event: 'canceled',
              oldTier: user.subscriptionTier,
              newTier: 'FREE',
              reason: 'Subscription canceled via Stripe',
            },
          }),
        ]);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!user) break;

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
          },
        }),
        prisma.subscriptionHistory.create({
          data: {
            userId: user.id,
            event: 'canceled',
            oldTier: user.subscriptionTier,
            newTier: 'FREE',
            reason: 'Subscription canceled',
          },
        }),
      ]);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'past_due',
          paymentFailedAt: user.paymentFailedAt ?? new Date(),
        },
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user) break;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'active',
            paymentFailedAt: null,
          },
        }),
        prisma.invoice.create({
          data: {
            userId: user.id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'paid',
            paidAt: new Date(),
            invoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
          },
        }),
      ]);
      break;
    }
  }
}

export async function requestDowngrade(
  userId: string,
  targetTier: SubscriptionTier,
  projectsToKeep?: string[]
) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  // Validate: can only downgrade to a lower tier
  const currentIdx = TIER_ORDER.indexOf(user.subscriptionTier);
  const targetIdx = TIER_ORDER.indexOf(targetTier);
  if (targetIdx >= currentIdx) {
    throw new AppError('Can only downgrade to a lower tier', 400, 'INVALID_DOWNGRADE');
  }

  // Validate: no existing pending downgrade
  if (user.pendingDowngrade) {
    throw new AppError(
      'A downgrade is already pending. Cancel it first to request a new one.',
      400,
      'DOWNGRADE_ALREADY_PENDING'
    );
  }

  // Validate projectsToKeep if provided
  const targetLimits = TIER_LIMITS[targetTier];
  if (projectsToKeep && projectsToKeep.length > 0) {
    if (projectsToKeep.length > targetLimits.projects) {
      throw new AppError(
        `Target tier allows max ${targetLimits.projects} projects`,
        400,
        'TOO_MANY_PROJECTS'
      );
    }
    const ownedProjects = await prisma.project.findMany({
      where: { userId, id: { in: projectsToKeep } },
      select: { id: true },
    });
    if (ownedProjects.length !== projectsToKeep.length) {
      throw new AppError(
        'Some projectsToKeep IDs do not belong to this user',
        400,
        'INVALID_PROJECTS'
      );
    }
  }

  // Cancel Stripe subscription at period end to get downgrade date
  if (!user.stripeSubscriptionId) {
    throw new AppError('No active subscription found', 400, 'NO_SUBSCRIPTION');
  }

  const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const downgradeDate = new Date(subscription.current_period_end * 1000);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        pendingDowngrade: true,
        downgradeDate,
        downgradeTo: targetTier,
        projectsToKeep: projectsToKeep ?? Prisma.DbNull,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event: 'downgrade_requested',
        oldTier: user.subscriptionTier,
        newTier: targetTier,
        reason: 'User requested downgrade',
        metadata: { downgradeDate: downgradeDate.toISOString(), projectsToKeep },
      },
    }),
  ]);

  return { downgradeDate, targetTier };
}

export async function cancelDowngrade(userId: string) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (!user.pendingDowngrade) {
    throw new AppError('No pending downgrade to cancel', 400, 'NO_PENDING_DOWNGRADE');
  }

  if (!user.stripeSubscriptionId) {
    throw new AppError('No active subscription found', 400, 'NO_SUBSCRIPTION');
  }

  // Re-enable subscription auto-renewal
  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        pendingDowngrade: false,
        downgradeDate: null,
        downgradeTo: null,
        projectsToKeep: Prisma.DbNull,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event: 'downgrade_canceled',
        oldTier: user.subscriptionTier,
        reason: 'User canceled pending downgrade',
      },
    }),
  ]);

  return { message: 'Downgrade canceled successfully' };
}
