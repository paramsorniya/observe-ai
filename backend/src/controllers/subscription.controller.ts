import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as subscriptionService from '../services/subscription.service.js';
import { config } from '../utils/config.js';

export async function createCheckout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { plan } = req.body;
    if (!plan) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Plan is required' });
      return;
    }
    const result = await subscriptionService.createCheckoutSession(req.userId!, plan);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createPortal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await subscriptionService.createPortalSession(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig || !config.STRIPE_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
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

export async function verifySession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'sessionId is required' });
      return;
    }
    await subscriptionService.verifyCheckoutSession(sessionId, req.userId!);
    res.json({ success: true });
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
    const result = await subscriptionService.requestDowngrade(req.userId!, targetTier, projectsToKeep);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function cancelDowngrade(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await subscriptionService.cancelDowngrade(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
