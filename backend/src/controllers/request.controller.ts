import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as requestService from '../services/request.service.js';

export async function getRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const query = requestService.requestQuerySchema.parse(req.query);
    const result = await requestService.getRequests(req.userId!, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const request = await requestService.getRequestById(req.params.id as string, req.userId!);
    res.json({ request });
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'projectId is required' });
      return;
    }
    const csv = await requestService.exportCsv(req.userId!, projectId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=requests.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
