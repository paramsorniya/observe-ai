import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { AppError, UnauthorizedError, NotFoundError } from '../errors/AppError.js';
import type { JwtPayload } from '../types/auth.types.js';

// In-memory brute-force protection
const loginAttempts = new Map<string, { count: number; lockedUntil: number | null }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkBruteForce(email: string): void {
  const key = email.toLowerCase();
  const record = loginAttempts.get(key);

  if (!record) return;

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    throw new AppError(
      `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      429,
      'ACCOUNT_LOCKED'
    );
  }

  // Lockout expired, reset
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginAttempts.delete(key);
  }
}

function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase();
  const record = loginAttempts.get(key) || { count: 0, lockedUntil: null };

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(key, record);
}

function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
  checkBruteForce(data.email);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    recordFailedAttempt(data.email);
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.isBanned) {
    throw new AppError('Account is banned', 403, 'ACCOUNT_BANNED');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    recordFailedAttempt(data.email);
    throw new UnauthorizedError('Invalid credentials');
  }

  clearFailedAttempts(data.email);
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
  checkBruteForce(data.email);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.isAdmin) {
    recordFailedAttempt(data.email);
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    recordFailedAttempt(data.email);
    throw new UnauthorizedError('Invalid credentials');
  }

  clearFailedAttempts(data.email);
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

export async function forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return { message: 'If that email is registered, a password reset link has been sent.' };
  }

  // Generate a random token and hash it for storage
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // In production, send an email with the reset link:
  // `${config.FRONTEND_URL}/reset-password?token=${rawToken}`
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${rawToken}`;
  console.log(`[Auth] Password reset link for ${user.email}: ${resetUrl}`);

  return { message: 'If that email is registered, a password reset link has been sent.' };
}

export async function resetPassword(data: z.infer<typeof resetPasswordSchema>) {
  const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return { message: 'Password has been reset successfully.' };
}
