import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config.js';
import { prisma } from '../utils/prisma.js';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth.types.js';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid token' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Account is banned' });
      return;
    }

    req.user = user;
    req.userId = user.id;

    // Update last active
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => { /* non-critical */ });

    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}
