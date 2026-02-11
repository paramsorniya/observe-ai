import type { Request } from 'express';
import type { User } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  isAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}
