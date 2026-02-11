import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as adminService from '../services/admin.service.js';

export async function getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const query = adminService.userListSchema.parse(req.query);
    const result = await adminService.getUsers(query);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getUserDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await adminService.getUserDetail(req.params.id as string);
    res.json({ user });
  } catch (err) { next(err); }
}

export async function banUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminService.banUser(req.params.id as string, req.body.reason);
    res.json({ message: 'User banned' });
  } catch (err) { next(err); }
}

export async function unbanUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminService.unbanUser(req.params.id as string);
    res.json({ message: 'User unbanned' });
  } catch (err) { next(err); }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminService.deleteUser(req.params.id as string);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
}

export async function overrideSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { tier } = req.body;
    if (!tier) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Tier is required' });
      return;
    }
    await adminService.overrideSubscription(req.params.id as string, tier);
    res.json({ message: 'Subscription updated' });
  } catch (err) { next(err); }
}

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getAdminDashboard();
    res.json(stats);
  } catch (err) { next(err); }
}

export async function getRevenue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getRevenueStats();
    res.json(stats);
  } catch (err) { next(err); }
}

export async function getSystemStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (err) { next(err); }
}
