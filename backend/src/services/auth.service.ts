import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { AppError, UnauthorizedError } from '../errors/AppError.js';
import type { JwtPayload } from '../types/auth.types.js';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateToken(userId: string, isAdmin: boolean): string {
  const payload: JwtPayload = { userId, isAdmin };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: isAdmin ? '24h' : '7d',
  });
}

export async function register(data: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      subscriptionTier: 'FREE',
      subscriptionStatus: 'active',
      monthlyRequestLimit: 10000,
      projectLimit: 1,
      requestResetDate: new Date(),
    },
  });

  const token = generateToken(user.id, user.isAdmin);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      monthlyRequestCount: user.monthlyRequestCount,
      monthlyRequestLimit: user.monthlyRequestLimit,
      projectLimit: user.projectLimit,
      isAdmin: user.isAdmin,
    },
    token,
  };
}

export async function login(data: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.isBanned) {
    throw new AppError('Account is banned', 403, 'ACCOUNT_BANNED');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = generateToken(user.id, user.isAdmin);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      monthlyRequestCount: user.monthlyRequestCount,
      monthlyRequestLimit: user.monthlyRequestLimit,
      projectLimit: user.projectLimit,
      isAdmin: user.isAdmin,
    },
    token,
  };
}

export async function adminLogin(data: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.isAdmin) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = generateToken(user.id, true);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    token,
  };
}
