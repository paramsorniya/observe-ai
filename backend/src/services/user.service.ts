import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, { message: 'Current password is required to set a new password' });

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyRequestCount: true,
      monthlyRequestLimit: true,
      projectLimit: true,
      pendingDowngrade: true,
      downgradeDate: true,
      downgradeTo: true,
      currentPeriodEnd: true,
      createdAt: true,
      lastActiveAt: true,
      _count: { select: { projects: true } },
    },
  });

  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function updateProfile(userId: string, data: z.infer<typeof updateProfileSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ValidationError('Email already in use');
    updateData.email = data.email;
  }

  if (data.newPassword && data.currentPassword) {
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect');
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });
}

export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  // Cascade delete handled by Prisma schema
  await prisma.user.delete({ where: { id: userId } });
}

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: {
        include: {
          requests: {
            take: 1000,
            orderBy: { timestamp: 'desc' },
            include: { toolCalls: true },
          },
        },
      },
      subscriptionHistory: true,
      invoices: true,
    },
  });

  if (!user) throw new NotFoundError('User not found');

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
    },
    projects: user.projects.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      requests: p.requests,
    })),
    subscriptionHistory: user.subscriptionHistory,
    invoices: user.invoices,
  };
}
