import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';

export interface ApiKeyRequest extends Request {
  project?: any;
  projectUser?: any;
}

export async function validateApiKey(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing API key' });
    return;
  }

  const project = await prisma.project.findUnique({
    where: { apiKey },
    include: { user: true },
  });

  if (!project) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid API key' });
    return;
  }

  if (!project.isActive) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Project is inactive' });
    return;
  }

  if (project.user.isBanned) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Account is banned' });
    return;
  }

  if (project.user.subscriptionStatus === 'canceled') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Subscription is canceled' });
    return;
  }

  req.project = project;
  req.projectUser = project.user;
  next();
}
