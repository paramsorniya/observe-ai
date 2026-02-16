import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as subscriptionService from '../services/subscription.service.js';
import * as mockPaymentService from '../services/mockPayment.service.js';
import { config } from '../utils/config.js';

const isMock = () => config.PAYMENT_MODE === 'mock';

export async function createCheckout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { plan } = req.body;
    if (!plan) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Plan is required' });
      return;
    }
    const result = isMock()
      ? await mockPaymentService.createCheckoutSession(req.userId!, plan)
      : await subscriptionService.createCheckoutSession(req.userId!, plan);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createPortal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = isMock()
      ? await mockPaymentService.createPortalSession(req.userId!)
      : await subscriptionService.createPortalSession(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig || !config.STRIPE_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Missing stripe signature' });
      return;
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(config.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);

    await subscriptionService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

export async function confirmMockPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!isMock()) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Mock payments are not enabled' });
      return;
    }
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Token is required' });
      return;
    }
    const result = await mockPaymentService.confirmMockPayment(req.userId!, token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function requestDowngrade(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = subscriptionService.requestDowngradeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0].message });
      return;
    }
    const { targetTier, projectsToKeep } = parsed.data;
    const result = isMock()
      ? await mockPaymentService.requestDowngrade(req.userId!, targetTier, projectsToKeep)
      : await subscriptionService.requestDowngrade(req.userId!, targetTier, projectsToKeep);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function cancelDowngrade(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = isMock()
      ? await mockPaymentService.cancelDowngrade(req.userId!)
      : await subscriptionService.cancelDowngrade(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
