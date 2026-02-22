import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../errors/AppError.js';
import { overrideSubscription } from './admin.service.js';

/* ─── Schemas ─── */

export const submitContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  useCase: z.string().min(1).max(2000),
  monthlyVolume: z.enum(['< 1M', '1M–5M', '5M–20M', '20M+']),
  phone: z.string().optional(),
});

export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'closed_won', 'closed_lost']).optional(),
});

export const updateLeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'closed_won', 'closed_lost']).optional(),
  adminNotes: z.string().optional(),
});

export const grantEnterpriseSchema = z.object({
  customRequestLimit: z.number().int().positive().default(999999999),
  customRetentionDays: z.number().int().positive().default(365),
  customTeamMembers: z.number().int().positive().default(999),
  monthlyPrice: z.number().int().min(0).default(0),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
  charged: z.boolean().default(false),
});

export const updateConfigSchema = z.object({
  customRequestLimit: z.number().int().positive().optional(),
  customRetentionDays: z.number().int().positive().optional(),
  customTeamMembers: z.number().int().positive().optional(),
  monthlyPrice: z.number().int().min(0).optional(),
  contractEnd: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const enterpriseUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

/* ─── Submit Contact (user-facing) ─── */

export async function submitEnterpriseContact(
  userId: string,
  data: z.infer<typeof submitContactSchema>
) {
  const contact = await prisma.enterpriseContact.create({
    data: {
      userId,
      name: data.name,
      email: data.email,
      company: data.company,
      role: data.role,
      useCase: data.useCase,
      monthlyVolume: data.monthlyVolume,
      phone: data.phone,
      status: 'new',
    },
  });
  return contact;
}

/* ─── Get Own Enterprise Config (user-facing) ─── */

export async function getMyEnterpriseConfig(userId: string) {
  const config = await prisma.enterpriseConfig.findUnique({
    where: { userId },
  });
  return config;
}

/* ─── Get Leads (admin) ─── */

export async function getEnterpriseLeads(query: z.infer<typeof leadsQuerySchema>) {
  const { page, limit, search, status } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.enterpriseContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true, subscriptionTier: true } },
      },
    }),
    prisma.enterpriseContact.count({ where }),
  ]);

  return {
    leads: contacts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/* ─── Update Lead (admin) ─── */

export async function updateEnterpriseLead(
  id: string,
  data: z.infer<typeof updateLeadSchema>
) {
  const contact = await prisma.enterpriseContact.findUnique({ where: { id } });
  if (!contact) throw new NotFoundError('Enterprise lead not found');

  return prisma.enterpriseContact.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
    },
  });
}

/* ─── Grant Enterprise (admin) ─── */

export async function grantEnterprise(
  userId: string,
  config: z.infer<typeof grantEnterpriseSchema>
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  // Override subscription to ENTERPRISE
  await overrideSubscription(userId, 'ENTERPRISE', config.reason, config.charged);

  // Upsert EnterpriseConfig
  const enterpriseConfig = await prisma.enterpriseConfig.upsert({
    where: { userId },
    create: {
      userId,
      customRequestLimit: config.customRequestLimit,
      customRetentionDays: config.customRetentionDays,
      customTeamMembers: config.customTeamMembers,
      monthlyPrice: config.monthlyPrice,
      contractStart: config.contractStart ? new Date(config.contractStart) : new Date(),
      contractEnd: config.contractEnd ? new Date(config.contractEnd) : null,
      notes: config.notes,
    },
    update: {
      customRequestLimit: config.customRequestLimit,
      customRetentionDays: config.customRetentionDays,
      customTeamMembers: config.customTeamMembers,
      monthlyPrice: config.monthlyPrice,
      contractStart: config.contractStart ? new Date(config.contractStart) : new Date(),
      contractEnd: config.contractEnd ? new Date(config.contractEnd) : null,
      notes: config.notes,
    },
  });

  // Update user's monthlyRequestLimit to the custom value
  await prisma.user.update({
    where: { id: userId },
    data: { monthlyRequestLimit: config.customRequestLimit },
  });

  return enterpriseConfig;
}

/* ─── Update Enterprise Config (admin) ─── */

export async function updateEnterpriseConfig(
  userId: string,
  data: z.infer<typeof updateConfigSchema>
) {
  const config = await prisma.enterpriseConfig.findUnique({ where: { userId } });
  if (!config) throw new NotFoundError('Enterprise config not found for this user');

  const updated = await prisma.enterpriseConfig.update({
    where: { userId },
    data: {
      ...(data.customRequestLimit !== undefined && { customRequestLimit: data.customRequestLimit }),
      ...(data.customRetentionDays !== undefined && { customRetentionDays: data.customRetentionDays }),
      ...(data.customTeamMembers !== undefined && { customTeamMembers: data.customTeamMembers }),
      ...(data.monthlyPrice !== undefined && { monthlyPrice: data.monthlyPrice }),
      ...(data.contractEnd !== undefined && { contractEnd: data.contractEnd ? new Date(data.contractEnd) : null }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  // Keep user's monthlyRequestLimit in sync
  if (data.customRequestLimit !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyRequestLimit: data.customRequestLimit },
    });
  }

  return updated;
}

/* ─── Get Enterprise Users (admin) ─── */

export async function getEnterpriseUsers(query: z.infer<typeof enterpriseUsersQuerySchema>) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: any = { subscriptionTier: 'ENTERPRISE', isAdmin: false };

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { planStartedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        planStartedAt: true,
        monthlyRequestLimit: true,
        monthlyRequestCount: true,
        enterpriseConfig: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
