import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as statsService from '../services/stats.service.js';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const stats = await statsService.getDashboardStats(projectId, req.userId!);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getRequestTimeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    const period = (req.query.period as 'day' | 'week') || 'day';
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const timeline = await statsService.getRequestTimeline(projectId, req.userId!, period);
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
}

export async function getCostBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const breakdown = await statsService.getCostBreakdown(projectId, req.userId!);
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
}

export async function getErrorStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const errors = await statsService.getErrorStats(projectId, req.userId!);
    res.json(errors);
  } catch (err) {
    next(err);
  }
}

export async function getOptimization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const result = await statsService.getOptimizationSuggestions(projectId, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getToolStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const tools = await statsService.getToolStats(projectId, req.userId!);
    res.json(tools);
  } catch (err) {
    next(err);
  }
}
