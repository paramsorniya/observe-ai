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

export async function exportUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const query = adminService.userListSchema.parse(req.query);
    const rows = await adminService.getUsersForExport(query);

    if (rows.length === 0) {
      res.status(200).json({ csv: '', count: 0 });
      return;
    }

    // Build CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];
    for (const row of rows) {
      const values = headers.map((h) => {
        const val = (row as any)[h];
        const str = val === null || val === undefined ? '' : String(val);
        // Escape CSV values that contain commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvLines.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvLines.join('\n'));
  } catch (err) { next(err); }
}

export async function bulkTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = adminService.bulkTagSchema.parse(req.body);
    const result = await adminService.bulkTagUsers(data);
    res.json(result);
  } catch (err) { next(err); }
}

export async function bulkRemoveTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { userIds, tag } = req.body;
    if (!userIds?.length || !tag) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'userIds and tag are required' });
      return;
    }
    const result = await adminService.bulkRemoveTag(userIds, tag);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getTags(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const tags = await adminService.getAllTags();
    res.json({ tags });
  } catch (err) { next(err); }
}

export async function getSegmentCounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const counts = await adminService.getSegmentCounts();
    res.json(counts);
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
    const { tier, reason } = req.body;
    if (!tier) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Tier is required' });
      return;
    }
    await adminService.overrideSubscription(req.params.id as string, tier, reason);
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

export async function getSubscriptionAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getSubscriptionAnalytics();
    res.json(data);
  } catch (err) { next(err); }
}

export async function getSystemStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (err) { next(err); }
}
