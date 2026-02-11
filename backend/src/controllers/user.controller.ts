import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as userService from '../services/user.service.js';

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getProfile(req.userId!);
    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = userService.updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(req.userId!, data);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await userService.deleteAccount(req.userId!);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}

export async function exportData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.exportUserData(req.userId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
