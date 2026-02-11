import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { AppError, NotFoundError } from '../errors/AppError.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier } from '@prisma/client';

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
    success_url: `${config.FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/upgrade`,
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
        data: { subscriptionStatus: 'past_due' },
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
          data: { subscriptionStatus: 'active' },
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
